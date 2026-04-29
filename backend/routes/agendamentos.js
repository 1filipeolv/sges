const express = require('express');
const { pool } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const filtroData = req.query.data || new Date().toISOString().split('T')[0];
    const result = await pool.query(`
      SELECT a.*, p.nome as pessoa_nome, p.funcao as pessoa_funcao,
        e.tipo as equipamento_tipo, e.numero as equipamento_numero,
        e.patrimonio as equipamento_patrimonio, e.descricao as equipamento_descricao,
        u.nome as operador
      FROM agendamentos a
      JOIN pessoas p ON p.id = a.pessoa_id
      JOIN equipamentos e ON e.id = a.equipamento_id
      JOIN usuarios u ON u.id = a.usuario_id
      WHERE a.data = $1 ORDER BY p.nome
    `, [filtroData]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  const { equipamento_id, pessoa_id, data, observacao } = req.body;
  try {
    const existe = await pool.query(
      'SELECT id FROM agendamentos WHERE equipamento_id=$1 AND data=$2',
      [equipamento_id, data]
    );
    if (existe.rows.length > 0) return res.status(400).json({ error: 'Equipamento já agendado para esta data' });
    const result = await pool.query(
      'INSERT INTO agendamentos (equipamento_id, pessoa_id, usuario_id, data, observacao) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [equipamento_id, pessoa_id, req.user.id, data, observacao]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM agendamentos WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;