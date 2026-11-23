const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Все маршруты администратора защищены проверкой роли
router.use(requireAdmin);

// GET /api/admin/stats - Сводная статистика для панели управления
router.get('/stats', async (req, res) => {
  try {
    const ordersStats = await db.query(`
      SELECT 
        COUNT(*)::int AS total_orders,
        COALESCE(SUM(total_price), 0)::numeric(10,2) AS total_revenue
      FROM orders
    `);

    const usersCount = await db.query('SELECT COUNT(*)::int AS total_users FROM users');
    const servicesCount = await db.query('SELECT COUNT(*)::int AS total_services FROM services');
    const reviewsCount = await db.query('SELECT COUNT(*)::int AS total_reviews FROM reviews');
    const categoriesCount = await db.query('SELECT COUNT(*)::int AS total_categories FROM categories');

    res.json({
      total_orders: ordersStats.rows[0].total_orders,
      total_revenue: ordersStats.rows[0].total_revenue,
      total_users: usersCount.rows[0].total_users,
      total_services: servicesCount.rows[0].total_services,
      total_reviews: reviewsCount.rows[0].total_reviews,
      total_categories: categoriesCount.rows[0].total_categories
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// GET /api/admin/orders - Просмотр всех заказов с JOIN данных клиентов и группировкой x2, x3
router.get('/orders', async (req, res) => {
  try {
    const ordersRes = await db.query(`
      SELECT 
        o.id,
        o.delivery_address,
        o.delivery_date,
        o.total_price,
        o.coupon_code,
        COALESCE(o.discount_amount, 0)::numeric(10,2) AS discount_amount,
        o.status,
        o.created_at,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        (
          SELECT json_agg(json_build_object(
            'service_name', s.name,
            'category_name', COALESCE(c.name, 'Без категории'),
            'quantity', oi.quantity,
            'price', oi.price_at_order,
            'image_url', s.image_url
          ))
          FROM order_items oi
          JOIN services s ON oi.service_id = s.id
          LEFT JOIN categories c ON s.category_id = c.id
          WHERE oi.order_id = o.id
        ) AS items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    // Группировка и форматирование строк с x2, x3
    const formattedOrders = ordersRes.rows.map(o => {
      const itemsList = o.items || [];
      const summaryString = itemsList.map(it => {
        return it.quantity > 1 ? `${it.service_name} (x${it.quantity})` : it.service_name;
      }).join(', ');

      return {
        ...o,
        items_summary: summaryString || 'Услуги салона'
      };
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error('Ошибка получения заказов админом:', error);
    res.status(500).json({ error: 'Не удалось загрузить заказы' });
  }
});

// PUT /api/admin/orders/:id/status - Смена статуса заказа
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Принят', 'В обработке', 'Выполнен', 'Отменен'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус заказа' });
    }

    // Проверка текущего статуса: завершенные заказы ('Выполнен' или 'Отменен') редактировать запрещено
    const checkOrder = await db.query('SELECT status FROM orders WHERE id = $1', [id]);
    if (checkOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    const currentStatus = checkOrder.rows[0].status;
    if (currentStatus === 'Выполнен' || currentStatus === 'Отменен') {
      return res.status(400).json({
        error: `Заказ уже находится в статусе "${currentStatus}". Изменение завершенных заказов заблокировано.`
      });
    }

    const updateRes = await db.query(`
      UPDATE orders 
      SET status = $1
      WHERE id = $2
      RETURNING id, status
    `, [status, id]);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json({ message: 'Статус заказа обновлен', order: updateRes.rows[0] });
  } catch (error) {
    console.error('Ошибка изменения статуса заказа:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

// DELETE /api/admin/orders/:id - Удаление заказа
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delRes = await db.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    res.json({ message: 'Заказ удален' });
  } catch (error) {
    console.error('Ошибка удаления заказа:', error);
    res.status(500).json({ error: 'Не удалось удалить заказ' });
  }
});

// GET /api/admin/users - Список всех пользователей с ролями через JOIN
router.get('/users', async (req, res) => {
  try {
    const usersRes = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.default_address,
        u.created_at,
        r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `);
    res.json(usersRes.rows);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Не удалось загрузить пользователей' });
  }
});

// PUT /api/admin/users/:id/role - Изменение роли пользователя
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const targetUserRes = await db.query('SELECT id, name, email, role_id FROM users WHERE id = $1', [id]);
    if (targetUserRes.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const targetUser = targetUserRes.rows[0];

    // Защита: нельзя понизить главного администратора системы
    if (targetUser.email.toLowerCase() === 'admin@lavka.ru' && role !== 'admin') {
      return res.status(403).json({ error: 'Нельзя понизить главного администратора системы (admin@lavka.ru)' });
    }

    // Защита: администратор не может снять роль администратора с самого себя
    if (req.user && req.user.id === targetUser.id && role !== 'admin') {
      return res.status(403).json({ error: 'Вы не можете снять роль администратора с самого себя' });
    }

    const roleRes = await db.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleRes.rows.length === 0) {
      return res.status(400).json({ error: 'Некорректная роль' });
    }

    const newRoleId = roleRes.rows[0].id;
    const updateRes = await db.query(`
      UPDATE users 
      SET role_id = $1 
      WHERE id = $2 
      RETURNING id, name, email
    `, [newRoleId, id]);

    res.json({ message: 'Роль пользователя успешно изменена', user: updateRes.rows[0] });
  } catch (error) {
    console.error('Ошибка изменения роли:', error);
    res.status(500).json({ error: 'Не удалось изменить роль: ' + error.message });
  }
});

// DELETE /api/admin/users/:id - Удаление пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const targetUserRes = await db.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (targetUserRes.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const targetUser = targetUserRes.rows[0];

    if (targetUser.email.toLowerCase() === 'admin@lavka.ru') {
      return res.status(403).json({ error: 'Нельзя удалить главного администратора системы' });
    }

    if (req.user && req.user.id === targetUser.id) {
      return res.status(400).json({ error: 'Нельзя удалить свой собственный аккаунт' });
    }

    const delRes = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    res.json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ error: 'Не удалось удалить пользователя: ' + error.message });
  }
});

// GET /api/admin/reviews - Все отзывы для модерации (через JOIN, с фильтрацией по поиску и оценке)
router.get('/reviews', async (req, res) => {
  try {
    const { search, rating } = req.query;

    let queryText = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.name AS author_name,
        u.email AS author_email,
        s.name AS service_name,
        COALESCE(c.name, 'Без категории') AS category_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let pIdx = 1;

    if (rating && rating !== 'all') {
      queryText += ` AND r.rating = $${pIdx}`;
      params.push(Number(rating));
      pIdx++;
    }

    if (search && search.trim()) {
      queryText += ` AND (LOWER(r.comment) LIKE $${pIdx} OR LOWER(u.name) LIKE $${pIdx} OR LOWER(s.name) LIKE $${pIdx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }

    queryText += ` ORDER BY r.created_at DESC`;

    const revRes = await db.query(queryText, params);
    res.json(revRes.rows);
  } catch (error) {
    console.error('Ошибка получения всех отзывов:', error);
    res.status(500).json({ error: 'Не удалось загрузить отзывы' });
  }
});

// DELETE /api/admin/reviews/:id - Удаление любого отзыва администратором
router.delete('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delRes = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [id]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }
    res.json({ message: 'Отзыв успешно удален администратором' });
  } catch (error) {
    console.error('Ошибка удаления отзыва:', error);
    res.status(500).json({ error: 'Не удалось удалить отзыв' });
  }
});

module.exports = router;
