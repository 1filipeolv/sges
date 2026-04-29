const express = require('express');
const { pool } = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const fora      = await pool.query(`SELECT COUNT(*) FROM equipamentos WHERE disponivel=FALSE`);
    const total     = await pool.query(`SELECT COUNT(*) FROM equipamentos`);
    const pendentes = await pool.query(`SELECT COUNT(DISTINCT m.id) FROM movimentacoes m WHERE m.data_devolucao IS NULL`);
    const atrasados = await pool.query(`
      SELECT COUNT(DISTINCT me.id) FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id=me.movimentacao_id
      WHERE me.data_devolucao IS NULL AND m.data_retirada < NOW() - INTERVAL '8 hours'`);
    const agend     = await pool.query(`SELECT COUNT(*) FROM agendamentos WHERE data=CURRENT_DATE`);
    res.json({
      equipamentos_fora:   parseInt(fora.rows[0].count),
      total_equipamentos:  parseInt(total.rows[0].count),
      retiradas_abertas:   parseInt(pendentes.rows[0].count),
      possiveis_atrasos:   parseInt(atrasados.rows[0].count),
      agendamentos_hoje:   parseInt(agend.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/abertos', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT me.id as item_id, e.patrimonio, e.tipo, e.descricao, e.numero,
        p.nome as pessoa_nome, p.funcao as pessoa_funcao,
        m.id as movimentacao_id, m.data_retirada, u.nome as operador
      FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id=me.movimentacao_id
      JOIN equipamentos e ON e.id=me.equipamento_id
      JOIN pessoas p ON p.id=m.pessoa_id
      JOIN usuarios u ON u.id=m.usuario_id
      WHERE me.data_devolucao IS NULL
      ORDER BY m.data_retirada DESC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/retirada', auth, async (req, res) => {
  const { pessoa_id, equipamentos_ids, observacao } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const eqId of equipamentos_ids) {
      const eq = await client.query('SELECT patrimonio, disponivel FROM equipamentos WHERE id=$1', [eqId]);
      if (!eq.rows[0]) throw new Error(`Equipamento ID ${eqId} não encontrado`);
      if (!eq.rows[0].disponivel) throw new Error(`${eq.rows[0].patrimonio || eqId} já está fora`);
      const agend = await client.query(
        `SELECT a.id, p.nome FROM agendamentos a JOIN pessoas p ON p.id=a.pessoa_id
         WHERE a.equipamento_id=$1 AND a.data=CURRENT_DATE AND a.pessoa_id!=$2`,
        [eqId, pessoa_id]
      );
      if (agend.rows.length > 0) throw new Error(`Equipamento agendado para ${agend.rows[0].nome} hoje`);
    }
    const mov = await client.query(
      'INSERT INTO movimentacoes (pessoa_id, usuario_id, observacao) VALUES ($1,$2,$3) RETURNING id',
      [pessoa_id, req.user.id, observacao]
    );
    const movId = mov.rows[0].id;
    for (const eqId of equipamentos_ids) {
      await client.query('INSERT INTO movimentacao_equipamentos (movimentacao_id, equipamento_id) VALUES ($1,$2)', [movId, eqId]);
      await client.query('UPDATE equipamentos SET disponivel=FALSE WHERE id=$1', [eqId]);
    }
    await client.query('COMMIT');
    res.status(201).json({ success: true, movimentacao_id: movId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally { client.release(); }
});

router.post('/devolucao/:patrimonio', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const eq = await client.query('SELECT * FROM equipamentos WHERE patrimonio=$1', [req.params.patrimonio]);
    if (!eq.rows[0]) throw new Error('Equipamento não encontrado');
    if (eq.rows[0].disponivel) throw new Error('Equipamento já está disponível');
    const eqId = eq.rows[0].id;
    const item = await client.query(
      'SELECT me.id FROM movimentacao_equipamentos me WHERE me.equipamento_id=$1 AND me.data_devolucao IS NULL LIMIT 1',
      [eqId]
    );
    if (!item.rows[0]) throw new Error('Nenhuma retirada em aberto');
    const now = new Date();
    await client.query('UPDATE movimentacao_equipamentos SET data_devolucao=$1 WHERE id=$2', [now, item.rows[0].id]);
    await client.query('UPDATE equipamentos SET disponivel=TRUE WHERE id=$1', [eqId]);
    await client.query(`
      UPDATE movimentacoes SET data_devolucao=$1
      WHERE id=(
        SELECT m.id FROM movimentacoes m
        JOIN movimentacao_equipamentos me ON me.movimentacao_id=m.id
        WHERE me.equipamento_id=$2 AND m.data_devolucao IS NULL
        AND NOT EXISTS (SELECT 1 FROM movimentacao_equipamentos me2 WHERE me2.movimentacao_id=m.id AND me2.data_devolucao IS NULL)
        LIMIT 1)`, [now, eqId]);
    await client.query('COMMIT');
    const info = await pool.query(`
      SELECT e.patrimonio, e.tipo, e.descricao, e.numero, p.nome as pessoa_nome, m.data_retirada
      FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id=me.movimentacao_id
      JOIN equipamentos e ON e.id=me.equipamento_id
      JOIN pessoas p ON p.id=m.pessoa_id
      WHERE me.equipamento_id=$1 ORDER BY me.data_devolucao DESC LIMIT 1`, [eqId]);
    res.json({ success: true, equipamento: info.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally { client.release(); }
});

router.post('/troca', auth, async (req, res) => {
  const { patrimonio_saida, patrimonio_entrada } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const eqSaida = await client.query('SELECT * FROM equipamentos WHERE patrimonio=$1', [patrimonio_saida]);
    if (!eqSaida.rows[0]) throw new Error('Equipamento a devolver não encontrado');
    if (eqSaida.rows[0].disponivel) throw new Error('Equipamento a devolver já está disponível');
    const eqEntrada = await client.query('SELECT * FROM equipamentos WHERE patrimonio=$1', [patrimonio_entrada]);
    if (!eqEntrada.rows[0]) throw new Error('Equipamento substituto não encontrado');
    if (!eqEntrada.rows[0].disponivel) throw new Error('Equipamento substituto já está fora');
    const now = new Date();
    const eqSaidaId = eqSaida.rows[0].id;
    const eqEntradaId = eqEntrada.rows[0].id;
    const itemSaida = await client.query(
      'SELECT me.id, me.movimentacao_id FROM movimentacao_equipamentos me WHERE me.equipamento_id=$1 AND me.data_devolucao IS NULL LIMIT 1',
      [eqSaidaId]
    );
    if (!itemSaida.rows[0]) throw new Error('Nenhuma retirada em aberto para o equipamento');
    const movId = itemSaida.rows[0].movimentacao_id;
    await client.query('UPDATE movimentacao_equipamentos SET data_devolucao=$1 WHERE id=$2', [now, itemSaida.rows[0].id]);
    await client.query('UPDATE equipamentos SET disponivel=TRUE WHERE id=$1', [eqSaidaId]);
    await client.query('INSERT INTO movimentacao_equipamentos (movimentacao_id, equipamento_id) VALUES ($1,$2)', [movId, eqEntradaId]);
    await client.query('UPDATE equipamentos SET disponivel=FALSE WHERE id=$1', [eqEntradaId]);
    await client.query('COMMIT');
    res.json({
      success: true,
      devolvido:  { patrimonio: eqSaida.rows[0].patrimonio,   tipo: eqSaida.rows[0].tipo,   numero: eqSaida.rows[0].numero },
      substituto: { patrimonio: eqEntrada.rows[0].patrimonio, tipo: eqEntrada.rows[0].tipo, numero: eqEntrada.rows[0].numero },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally { client.release(); }
});

router.get('/historico', auth, async (req, res) => {
  try {
    const { de, ate, pessoa_id, patrimonio } = req.query;
    let query = `
      SELECT me.id, e.patrimonio, e.tipo, e.descricao, e.numero,
        p.nome as pessoa_nome, p.funcao as pessoa_funcao,
        m.data_retirada, me.data_devolucao, u.nome as operador, m.observacao
      FROM movimentacao_equipamentos me
      JOIN movimentacoes m ON m.id=me.movimentacao_id
      JOIN equipamentos e ON e.id=me.equipamento_id
      JOIN pessoas p ON p.id=m.pessoa_id
      JOIN usuarios u ON u.id=m.usuario_id WHERE 1=1`;
    const params = [];
    if (de)        { params.push(de);               query += ` AND m.data_retirada >= $${params.length}`; }
    if (ate)       { params.push(ate+' 23:59:59');  query += ` AND m.data_retirada <= $${params.length}`; }
    if (pessoa_id) { params.push(pessoa_id);         query += ` AND m.pessoa_id = $${params.length}`; }
    if (patrimonio){ params.push(`%${patrimonio}%`); query += ` AND e.patrimonio ILIKE $${params.length}`; }
    query += ' ORDER BY m.data_retirada DESC LIMIT 200';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;