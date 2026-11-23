const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Все маршруты корзины защищены авторизацией (корзина сохраняется в БД уникально для пользователя)
router.use(requireAuth);

// GET /api/cart - Получение корзины текущего пользователя (все данные подтягиваются через JOIN)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        ci.id AS cart_item_id,
        s.id AS service_id,
        s.name AS service_name,
        s.description,
        s.duration_minutes AS duration,
        s.price,
        COALESCE(s.discount_percent, 0)::int AS discount_percent,
        ROUND(s.price * (1 - COALESCE(s.discount_percent, 0)::numeric / 100), 2)::numeric(10,2) AS final_price,
        COALESCE(s.stock, 10)::int AS stock,
        s.image_url,
        COALESCE(c.name, 'Без категории') AS category_name,
        ci.quantity,
        (ROUND(s.price * (1 - COALESCE(s.discount_percent, 0)::numeric / 100), 2) * ci.quantity)::numeric(10,2) AS item_total
      FROM cart_items ci
      JOIN services s ON ci.service_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at ASC
    `, [req.user.id]);

    const items = result.rows;
    const totalAmount = items.reduce((sum, item) => sum + Number(item.item_total), 0);
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      items,
      total_amount: totalAmount,
      total_count: totalCount
    });
  } catch (error) {
    console.error('Ошибка при получении корзины:', error);
    res.status(500).json({ error: 'Не удалось загрузить корзину' });
  }
});

// POST /api/cart - Добавление услуги в корзину (с валидацией лимитов мастера)
router.post('/', async (req, res) => {
  try {
    const { service_id, quantity = 1 } = req.body;

    if (!service_id) {
      return res.status(400).json({ error: 'Не указана услуга для добавления' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Количество должно быть больше нуля' });
    }

    // Проверяем существование услуги и остаток
    const serviceCheck = await db.query('SELECT id, name, duration_minutes, COALESCE(stock, 10)::int AS stock FROM services WHERE id = $1', [service_id]);
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    const service = serviceCheck.rows[0];

    // Проверяем текущее состояние корзины пользователя
    const currentCartRes = await db.query(`
      SELECT ci.service_id, ci.quantity, s.duration_minutes
      FROM cart_items ci
      JOIN services s ON ci.service_id = s.id
      WHERE ci.user_id = $1
    `, [req.user.id]);

    const existingItem = currentCartRes.rows.find(i => i.service_id === Number(service_id));
    const newQty = (existingItem ? existingItem.quantity : 0) + qty;

    if (newQty > service.stock) {
      return res.status(400).json({
        error: `На складе осталось только ${service.stock} шт. услуги "${service.name}". Вы не можете добавить больше.`
      });
    }

    // Лимит 1: не более 3 повторов одной процедуры за один визит
    if (newQty > 3) {
      return res.status(400).json({
        error: `Один мастер не может выполнить процедуру "${service.name}" более 3 раз за один визит.`
      });
    }

    // Лимит 2: суммарное время сеанса мастера не более 360 минут (6 часов)
    let totalDuration = 0;
    for (const item of currentCartRes.rows) {
      if (item.service_id === Number(service_id)) continue;
      totalDuration += (item.quantity * (item.duration_minutes || 60));
    }
    totalDuration += (newQty * (service.duration_minutes || 60));

    if (totalDuration > 360) {
      return res.status(400).json({
        error: `Превышен лимит времени мастера на один визит (максимум 6 часов). Суммарная длительность составит ${totalDuration} мин.`
      });
    }

    // Добавляем или обновляем количество в БД (UPSERT)
    await db.query(`
      INSERT INTO cart_items (user_id, service_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, service_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    `, [req.user.id, service_id, qty]);

    res.status(201).json({ message: 'Услуга успешно добавлена в корзину' });
  } catch (error) {
    console.error('Ошибка добавления в корзину:', error);
    res.status(500).json({ error: 'Ошибка сохранения в корзине' });
  }
});

// PUT /api/cart/:service_id - Изменение количества услуги в корзине (с валидацией лимитов мастера)
router.put('/:service_id', async (req, res) => {
  try {
    const { service_id } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) {
      return res.status(400).json({ error: 'Некорректное количество' });
    }

    if (qty <= 0) {
      // Если количество 0 или меньше, удаляем из корзины
      await db.query('DELETE FROM cart_items WHERE user_id = $1 AND service_id = $2', [req.user.id, service_id]);
      return res.json({ message: 'Услуга удалена из корзины' });
    }

    if (qty > 3) {
      return res.status(400).json({ error: 'Один мастер не может выполнить более 3 одинаковых процедур за один визит' });
    }

    // Проверяем суммарную длительность визита
    const currentCartRes = await db.query(`
      SELECT ci.service_id, ci.quantity, s.duration_minutes
      FROM cart_items ci
      JOIN services s ON ci.service_id = s.id
      WHERE ci.user_id = $1
    `, [req.user.id]);

    const targetService = await db.query('SELECT id, name, duration_minutes, COALESCE(stock, 10)::int AS stock FROM services WHERE id = $1', [service_id]);
    if (targetService.rows.length === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    const serviceObj = targetService.rows[0];
    const serviceDur = serviceObj.duration_minutes || 60;

    if (qty > serviceObj.stock) {
      return res.status(400).json({
        error: `На складе доступно только ${serviceObj.stock} шт. услуги "${serviceObj.name}".`
      });
    }

    let totalDuration = 0;
    for (const item of currentCartRes.rows) {
      if (item.service_id === Number(service_id)) continue;
      totalDuration += (item.quantity * (item.duration_minutes || 60));
    }
    totalDuration += (qty * serviceDur);

    if (totalDuration > 360) {
      return res.status(400).json({
        error: `Превышен лимит времени мастера на один визит (максимум 6 часов). Суммарная длительность составит ${totalDuration} мин.`
      });
    }

    const updateRes = await db.query(`
      UPDATE cart_items 
      SET quantity = $1
      WHERE user_id = $2 AND service_id = $3
      RETURNING id, quantity
    `, [qty, req.user.id, service_id]);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Товар в корзине не найден' });
    }

    res.json({ message: 'Количество обновлено', quantity: qty });
  } catch (error) {
    console.error('Ошибка обновления количества в корзине:', error);
    res.status(500).json({ error: 'Не удалось обновить корзину' });
  }
});

// DELETE /api/cart/:service_id - Удаление услуги из корзины
router.delete('/:service_id', async (req, res) => {
  try {
    const { service_id } = req.params;
    const delRes = await db.query('DELETE FROM cart_items WHERE user_id = $1 AND service_id = $2 RETURNING id', [req.user.id, service_id]);
    
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Позиция в корзине не найдена' });
    }

    res.json({ message: 'Услуга удалена из корзины' });
  } catch (error) {
    console.error('Ошибка удаления из корзины:', error);
    res.status(500).json({ error: 'Ошибка при удалении' });
  }
});

// DELETE /api/cart - Полная очистка корзины текущего пользователя
router.delete('/', async (req, res) => {
  try {
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Корзина успешно очищена' });
  } catch (error) {
    console.error('Ошибка очистки корзины:', error);
    res.status(500).json({ error: 'Не удалось очистить корзину' });
  }
});

module.exports = router;
