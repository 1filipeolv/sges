require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pessoas', require('./routes/pessoas'));
app.use('/api/equipamentos', require('./routes/equipamentos'));
app.use('/api/movimentacoes', require('./routes/movimentacoes'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
}).catch(err => {
  console.error('Erro ao inicializar banco:', err);
  process.exit(1);
});
