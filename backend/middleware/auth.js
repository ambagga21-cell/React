const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_key_student_project_2026';

// Middleware для извлечения пользователя из JWT-токена
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

// Middleware: только для авторизованных пользователей
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется авторизация для доступа к этому разделу' });
  }
  next();
}

// Middleware: только для администраторов
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
  }
  next();
}

module.exports = {
  authMiddleware,
  requireAuth,
  requireAdmin,
  JWT_SECRET
};
