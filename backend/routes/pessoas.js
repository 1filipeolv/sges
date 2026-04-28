const express = require('express');
const { pool } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Listar todas
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pessoas ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar
router.post('/', auth, adminOnly, async (req, res) => {
  const { nome, funcao, contato } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO pessoas (nome, funcao, contato) VALUES ($1, $2, $3) RETURNING *',
      [nome, funcao, contato]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { nome, funcao, contato } = req.body;
  try {
    const result = await pool.query(
      'UPDATE pessoas SET nome=$1, funcao=$2, contato=$3 WHERE id=$4 RETURNING *',
      [nome, funcao, contato, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM pessoas WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
