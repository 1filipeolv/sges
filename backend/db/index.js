const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        perfil VARCHAR(20) NOT NULL DEFAULT 'OPERADOR',
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pessoas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        funcao VARCHAR(100) NOT NULL,
        contato VARCHAR(255),
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS equipamentos (
        id SERIAL PRIMARY KEY,
        numero INTEGER,
        patrimonio VARCHAR(100) UNIQUE,
        tipo VARCHAR(100) NOT NULL,
        descricao VARCHAR(255),
        disponivel BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS agendamentos (
        id SERIAL PRIMARY KEY,
        equipamento_id INTEGER REFERENCES equipamentos(id) ON DELETE CASCADE,
        pessoa_id INTEGER REFERENCES pessoas(id),
        usuario_id INTEGER REFERENCES usuarios(id),
        data DATE NOT NULL,
        observacao TEXT,
        criado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS movimentacoes (
        id SERIAL PRIMARY KEY,
        pessoa_id INTEGER REFERENCES pessoas(id),
        usuario_id INTEGER REFERENCES usuarios(id),
        data_retirada TIMESTAMP DEFAULT NOW(),
        data_devolucao TIMESTAMP,
        observacao TEXT
      );

      CREATE TABLE IF NOT EXISTS movimentacao_equipamentos (
        id SERIAL PRIMARY KEY,
        movimentacao_id INTEGER REFERENCES movimentacoes(id) ON DELETE CASCADE,
        equipamento_id INTEGER REFERENCES equipamentos(id),
        data_devolucao TIMESTAMP
      );
    `);

    await client.query(`ALTER TABLE equipamentos ALTER COLUMN patrimonio DROP NOT NULL;`).catch(() => {});

    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    if (adminEmail && adminPassword) {
      const exists = await client.query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);
      if (exists.rows.length === 0) {
        const hash = await bcrypt.hash(adminPassword, 10);
        await client.query(
          'INSERT INTO usuarios (nome, email, senha, perfil) VALUES ($1,$2,$3,$4)',
          [adminName, adminEmail, hash, 'ADMIN']
        );
        console.log('✅ Admin criado:', adminEmail);
      }
    }
    console.log('✅ Banco inicializado');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };