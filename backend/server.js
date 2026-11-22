const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { authMiddleware } = require('./middleware/auth');
const initDatabase = require('./init_db');

const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const servicesRoutes = require('./routes/services');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const reviewsRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);

// Тестовый endpoint для проверки работоспособности API
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API работает успешно!', timestamp: new Date() });
});

// Тест подключения к PostgreSQL (как в репозитории преподавателя)
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time');
    res.json({
      message: 'Подключение к БД PostgreSQL работает штатно!',
      current_time: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Главная страница порта 3001 (для предотвращения ошибки Cannot GET /)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="utf-8">
      <title>Backend API — «Эстетика & Сервис»</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 32px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 520px; text-align: center; border: 1px solid #334155; }
        h1 { color: #38bdf8; margin-top: 0; font-size: 22px; }
        p { color: #94a3b8; font-size: 15px; line-height: 1.5; }
        .btn { display: inline-block; margin-top: 16px; padding: 10px 20px; background: #0284c7; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .btn:hover { background: #0369a1; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Backend API сервера работает (порт ${PORT})</h1>
        <p>REST API для веб-приложения онлайн-заказа услуг и товаров успешно запущено и подключено к базе данных PostgreSQL.</p>
        <p>Тестовый endpoint: <a href="/api/test" style="color: #38bdf8;">/api/test</a></p>
        <a href="http://localhost:3000" class="btn">Перейти к веб-интерфейсу (порт 3000)</a>
      </div>
    </body>
    </html>
  `);
});

let serverInstance = null;

async function start() {
  await initDatabase();
  return new Promise((resolve) => {
    if (serverInstance) return resolve(serverInstance);
    serverInstance = app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      resolve(serverInstance);
    });
  });
}

async function stop() {
  return new Promise((resolve) => {
    if (!serverInstance) return resolve();
    serverInstance.close(() => {
      serverInstance = null;
      console.log('Backend stopped');
      resolve();
    });
  });
}

if (require.main === module) {
  start();
}

module.exports = {
  app,
  start,
  stop
};
