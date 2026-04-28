const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar usuários (admin)
router.get('/usuarios', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, perfil, criado_em FROM usuarios ORDER BY nome'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar usuário (admin)
router.post('/usuarios', auth, adminOnly, async (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  try {
    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil',
      [nome, email, hash, perfil || 'OPERADOR']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email já cadastrado' });
    res.status(500).json({ error: err.message });
  }
});

// Editar usuário (admin)
router.put('/usuarios/:id', auth, adminOnly, async (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  try {
    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      await pool.query(
        'UPDATE usuarios SET nome=$1, email=$2, senha=$3, perfil=$4 WHERE id=$5',
        [nome, email, hash, perfil, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET nome=$1, email=$2, perfil=$3 WHERE id=$4',
        [nome, email, perfil, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar usuário (admin)
router.delete('/usuarios/:id', auth, adminOnly, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
