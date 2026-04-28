const express = require('express');
const { pool } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Listar todos
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
        CASE WHEN e.disponivel = FALSE THEN (
          SELECT p.nome FROM movimentacao_equipamentos me
          JOIN movimentacoes m ON m.id = me.movimentacao_id
          JOIN pessoas p ON p.id = m.pessoa_id
          WHERE me.equipamento_id = e.id AND me.data_devolucao IS NULL
          ORDER BY m.data_retirada DESC LIMIT 1
        ) END as retirado_por
      FROM equipamentos e
      ORDER BY e.tipo, e.patrimonio
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar por patrimônio (scan)
router.get('/scan/:patrimonio', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM equipamentos WHERE patrimonio = $1',
      [req.params.patrimonio]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Equipamento não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar
router.post('/', auth, adminOnly, async (req, res) => {
  const { patrimonio, tipo, descricao } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO equipamentos (patrimonio, tipo, descricao) VALUES ($1, $2, $3) RETURNING *',
      [patrimonio, tipo, descricao]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Patrimônio já cadastrado' });
    res.status(500).json({ error: err.message });
  }
});

// Editar
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { patrimonio, tipo, descricao } = req.body;
  try {
    const result = await pool.query(
      'UPDATE equipamentos SET patrimonio=$1, tipo=$2, descricao=$3 WHERE id=$4 RETURNING *',
      [patrimonio, tipo, descricao, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const eq = await pool.query('SELECT disponivel FROM equipamentos WHERE id=$1', [req.params.id]);
    if (!eq.rows[0]) return res.status(404).json({ error: 'Não encontrado' });
    if (!eq.rows[0].disponivel) return res.status(400).json({ error: 'Equipamento está fora, não pode ser removido' });
    await pool.query('DELETE FROM equipamentos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
