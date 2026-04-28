const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.perfil !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  }
  next();
};

module.exports = { auth, adminOnly };
