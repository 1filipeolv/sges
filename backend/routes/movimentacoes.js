const express = require('express');
const { pool } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const fora = await pool.query(`SELECT COUNT(*) FROM equipamentos WHERE disponivel = FALSE`);
    const total = await pool.query(`SELECT COUNT(*) FROM equipamentos`);
    const pendentes = await pool.query(`
      SELECT COUNT(DISTINCT m.id) FROM movimentacoes m
      WHERE m.data_devolucao IS NULL
    `);
    const atrasados = await pool.query(`
      SELECT COUNT(DISTINCT me.id) FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id = me.movimentacao_id
      WHERE me.data_devolucao IS NULL
      AND m.data_retirada < NOW() - INTERVAL '8 hours'
    `);
    res.json({
      equipamentos_fora: parseInt(fora.rows[0].count),
      total_equipamentos: parseInt(total.rows[0].count),
      retiradas_abertas: parseInt(pendentes.rows[0].count),
      possiveis_atrasos: parseInt(atrasados.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Equipamentos fora agora
router.get('/abertos', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        me.id as item_id,
        e.patrimonio, e.tipo, e.descricao,
        p.nome as pessoa_nome, p.funcao as pessoa_funcao,
        m.id as movimentacao_id,
        m.data_retirada,
        u.nome as operador
      FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id = me.movimentacao_id
      JOIN equipamentos e ON e.id = me.equipamento_id
      JOIN pessoas p ON p.id = m.pessoa_id
      JOIN usuarios u ON u.id = m.usuario_id
      WHERE me.data_devolucao IS NULL
      ORDER BY m.data_retirada DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar retirada
router.post('/retirada', auth, async (req, res) => {
  const { pessoa_id, equipamentos_ids, observacao } = req.body;
  // equipamentos_ids = array de IDs de equipamentos

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar se algum equipamento está indisponível
    for (const eqId of equipamentos_ids) {
      const eq = await client.query('SELECT patrimonio, disponivel FROM equipamentos WHERE id=$1', [eqId]);
      if (!eq.rows[0]) throw new Error(`Equipamento ID ${eqId} não encontrado`);
      if (!eq.rows[0].disponivel) throw new Error(`Equipamento ${eq.rows[0].patrimonio} já está fora`);
    }

    // Criar movimentação
    const mov = await client.query(
      'INSERT INTO movimentacoes (pessoa_id, usuario_id, observacao) VALUES ($1, $2, $3) RETURNING id',
      [pessoa_id, req.user.id, observacao]
    );
    const movId = mov.rows[0].id;

    // Registrar cada equipamento
    for (const eqId of equipamentos_ids) {
      await client.query(
        'INSERT INTO movimentacao_equipamentos (movimentacao_id, equipamento_id) VALUES ($1, $2)',
        [movId, eqId]
      );
      await client.query('UPDATE equipamentos SET disponivel=FALSE WHERE id=$1', [eqId]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, movimentacao_id: movId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Devolução por patrimônio (scan)
router.post('/devolucao/:patrimonio', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eq = await client.query('SELECT * FROM equipamentos WHERE patrimonio=$1', [req.params.patrimonio]);
    if (!eq.rows[0]) throw new Error('Equipamento não encontrado');
    if (eq.rows[0].disponivel) throw new Error('Equipamento já está disponível');

    const eqId = eq.rows[0].id;

    // Buscar item de movimentação em aberto
    const item = await client.query(`
      SELECT me.id FROM movimentacao_equipamentos me
      WHERE me.equipamento_id = $1 AND me.data_devolucao IS NULL
      LIMIT 1
    `, [eqId]);

    if (!item.rows[0]) throw new Error('Nenhuma retirada em aberto para este equipamento');

    const now = new Date();
    await client.query(
      'UPDATE movimentacao_equipamentos SET data_devolucao=$1 WHERE id=$2',
      [now, item.rows[0].id]
    );
    await client.query('UPDATE equipamentos SET disponivel=TRUE WHERE id=$1', [eqId]);

    // Verificar se a movimentação inteira foi devolvida
    const pendentes = await client.query(`
      SELECT COUNT(*) FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id = me.movimentacao_id
      WHERE me.equipamento_id = $1 AND me.data_devolucao IS NULL
    `, [eqId]);

    // Fechar movimentação se todos devolvidos
    await client.query(`
      UPDATE movimentacoes SET data_devolucao = $1
      WHERE id = (
        SELECT m.id FROM movimentacoes m
        JOIN movimentacao_equipamentos me ON me.movimentacao_id = m.id
        WHERE me.equipamento_id = $2 AND m.data_devolucao IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM movimentacao_equipamentos me2
          WHERE me2.movimentacao_id = m.id AND me2.data_devolucao IS NULL
        )
        LIMIT 1
      )
    `, [now, eqId]);

    await client.query('COMMIT');

    // Retornar info do equipamento devolvido
    const info = await pool.query(`
      SELECT e.patrimonio, e.tipo, e.descricao, p.nome as pessoa_nome, m.data_retirada
      FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id = me.movimentacao_id
      JOIN equipamentos e ON e.id = me.equipamento_id
      JOIN pessoas p ON p.id = m.pessoa_id
      WHERE me.equipamento_id = $1
      ORDER BY me.data_devolucao DESC LIMIT 1
    `, [eqId]);

    res.json({ success: true, equipamento: info.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Histórico completo
router.get('/historico', auth, async (req, res) => {
  try {
    const { de, ate, pessoa_id, patrimonio } = req.query;
    let query = `
      SELECT 
        me.id,
        e.patrimonio, e.tipo, e.descricao,
        p.nome as pessoa_nome, p.funcao as pessoa_funcao,
        m.data_retirada, me.data_devolucao,
        u.nome as operador,
        m.observacao
      FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id = me.movimentacao_id
      JOIN equipamentos e ON e.id = me.equipamento_id
      JOIN pessoas p ON p.id = m.pessoa_id
      JOIN usuarios u ON u.id = m.usuario_id
      WHERE 1=1
    `;
    const params = [];

    if (de) { params.push(de); query += ` AND m.data_retirada >= $${params.length}`; }
    if (ate) { params.push(ate + ' 23:59:59'); query += ` AND m.data_retirada <= $${params.length}`; }
    if (pessoa_id) { params.push(pessoa_id); query += ` AND m.pessoa_id = $${params.length}`; }
    if (patrimonio) { params.push(`%${patrimonio}%`); query += ` AND e.patrimonio ILIKE $${params.length}`; }

    query += ' ORDER BY m.data_retirada DESC LIMIT 200';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
