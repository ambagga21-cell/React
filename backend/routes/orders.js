const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// POST /api/orders - Оформление заказа из корзины с сохранением в БД
router.post('/', async (req, res) => {
  try {
    const { delivery_address, delivery_date, coupon_code } = req.body;

    // 1. Валидация адреса доставки
    if (!delivery_address || delivery_address.trim().length < 5) {
      return res.status(400).json({ error: 'Укажите полный адрес доставки (не менее 5 символов)' });
    }

    // 2. Валидация даты доставки (Requirement 2.3: не может быть меньше текущей даты)
    if (!delivery_date) {
      return res.status(400).json({ error: 'Укажите дату доставки' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const chosenDate = new Date(delivery_date);
    chosenDate.setHours(0, 0, 0, 0);

    if (isNaN(chosenDate.getTime())) {
      return res.status(400).json({ error: 'Некорректный формат даты доставки' });
    }

    if (chosenDate < today) {
      return res.status(400).json({ error: 'Дата доставки не может быть меньше текущей даты' });
    }

    // 3. Получение товаров из корзины пользователя в БД
    const cartRes = await db.query(`
      SELECT 
        ci.service_id, 
        ci.quantity, 
        s.name AS service_name, 
        s.duration_minutes AS duration,
        s.price, 
        COALESCE(s.discount_percent, 0)::int AS discount_percent,
        ROUND(s.price * (1 - COALESCE(s.discount_percent, 0)::numeric / 100), 2)::numeric(10,2) AS final_price,
        COALESCE(s.stock, 10)::int AS stock,
        COALESCE(c.name, 'Без категории') AS category_name
      FROM cart_items ci
      JOIN services s ON ci.service_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE ci.user_id = $1
    `, [req.user.id]);

    if (cartRes.rows.length === 0) {
      return res.status(400).json({ error: 'Ваша корзина пуста. Добавьте услуги перед оформлением заказа.' });
    }

    const cartItems = cartRes.rows;

    // Валидация остатка на складе
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({
          error: `Услуги/товара "${item.service_name}" недостаточно на складе (в наличии: ${item.stock} шт., в заказе: ${item.quantity} шт.).`
        });
      }
    }

    const totalDuration = cartItems.reduce((sum, item) => sum + ((Number(item.duration) || 60) * item.quantity), 0);
    if (totalDuration > 360) {
      return res.status(400).json({
        error: `Превышен лимит рабочего времени мастера на один визит (максимум 6 часов). Суммарная длительность: ${totalDuration} мин.`
      });
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.final_price || item.price) * item.quantity), 0);

    // Валидация промокода (если указан)
    let appliedCoupon = null;
    let discountAmount = 0;
    if (coupon_code && coupon_code.trim()) {
      const codeUpper = coupon_code.trim().toUpperCase();
      const cRes = await db.query(
        'SELECT code, discount_percent, is_active, first_order_only FROM coupons WHERE UPPER(code) = $1',
        [codeUpper]
      );
      if (cRes.rows.length === 0 || !cRes.rows[0].is_active) {
        return res.status(400).json({ error: 'Указанный промокод не найден или срок его действия истек' });
      }

      // Проверка 1: не использовал ли пользователь уже этот промокод
      const usedCheck = await db.query(
        "SELECT id FROM orders WHERE user_id = $1 AND UPPER(coupon_code) = $2 AND status != 'Отменен'",
        [req.user.id, codeUpper]
      );
      if (usedCheck.rows.length > 0) {
        return res.status(400).json({
          error: `Вы уже использовали промокод "${codeUpper}" в заказе №${usedCheck.rows[0].id}. Повторное использование запрещено.`
        });
      }

      // Проверка 2: если промокод только на первый заказ
      if (cRes.rows[0].first_order_only) {
        const orderHistoryCheck = await db.query(
          "SELECT COUNT(*)::int AS count FROM orders WHERE user_id = $1 AND status != 'Отменен'",
          [req.user.id]
        );
        const prevCount = orderHistoryCheck.rows[0] ? orderHistoryCheck.rows[0].count : 0;
        if (prevCount > 0) {
          return res.status(400).json({
            error: `Промокод "${codeUpper}" действует исключительно на первый заказ нового клиента.`
          });
        }
      }

      appliedCoupon = cRes.rows[0].code;
      const discPercent = cRes.rows[0].discount_percent;
      discountAmount = Math.round(subtotal * (discPercent / 100.0) * 100) / 100;
    }

    const finalTotalPrice = Math.max(0, subtotal - discountAmount);

    // 4. Создание записи заказа в транзакции
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const orderInsertRes = await client.query(`
        INSERT INTO orders (user_id, delivery_address, delivery_date, total_price, coupon_code, discount_amount, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'Принят')
        RETURNING id, delivery_address, delivery_date, total_price, coupon_code, discount_amount, status, created_at
      `, [req.user.id, delivery_address.trim(), delivery_date, finalTotalPrice, appliedCoupon, discountAmount]);

      const order = orderInsertRes.rows[0];

      // Сохранение каждой позиции заказа и списание со склада
      for (const item of cartItems) {
        const itemPrice = Number(item.final_price || item.price);
        await client.query(`
          INSERT INTO order_items (order_id, service_id, quantity, price_at_order)
          VALUES ($1, $2, $3, $4)
        `, [order.id, item.service_id, item.quantity, itemPrice]);

        // Списание со склада
        await client.query(`
          UPDATE services 
          SET stock = GREATEST(0, stock - $1)
          WHERE id = $2
        `, [item.quantity, item.service_id]);
      }

      // Очищаем корзину пользователя в БД
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

      // Если у пользователя не был указан адрес по умолчанию, сохраняем его
      await client.query(`
        UPDATE users 
        SET default_address = COALESCE(NULLIF(default_address, ''), $1)
        WHERE id = $2
      `, [delivery_address.trim(), req.user.id]);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Заказ успешно оформлен и сохранен на сервере',
        order: {
          id: order.id,
          delivery_address: order.delivery_address,
          delivery_date: order.delivery_date,
          total_price: order.total_price,
          coupon_code: order.coupon_code,
          discount_amount: order.discount_amount,
          status: order.status,
          created_at: order.created_at,
          items_count: cartItems.length
        }
      });
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Не удалось оформить заказ. Попробуйте снова.' });
  }
});

// GET /api/orders/my - Просмотр всех заказов текущего пользователя (через JOIN)
router.get('/my', async (req, res) => {
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
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    // Добавляем понятную текстовую строку состава с группировкой x2, x3
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
    console.error('Ошибка получения заказов пользователя:', error);
    res.status(500).json({ error: 'Не удалось загрузить историю заказов' });
  }
});

module.exports = router;
