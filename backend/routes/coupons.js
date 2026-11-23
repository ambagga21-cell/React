const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/coupons/validate/:code - Проверка и применение промокода
router.get('/validate/:code', async (req, res) => {
  try {
    const code = req.params.code ? req.params.code.trim().toUpperCase() : '';
    if (!code) {
      return res.status(400).json({ error: 'Укажите промокод' });
    }

    const result = await db.query(
      'SELECT id, code, discount_percent, description, is_active FROM coupons WHERE UPPER(code) = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Промокод не найден' });
    }

    const coupon = result.rows[0];
    if (!coupon.is_active) {
      return res.status(400).json({ error: 'Срок действия данного промокода истек' });
    }

    res.json({
      valid: true,
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      description: coupon.description
    });
  } catch (error) {
    console.error('Ошибка проверки промокода:', error);
    res.status(500).json({ error: 'Ошибка проверки промокода' });
  }
});

// GET /api/coupons - Список всех промокодов (для админа)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM coupons ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка загрузки промокодов:', error);
    res.status(500).json({ error: 'Не удалось получить промокоды' });
  }
});

// POST /api/coupons - Создание нового промокода (для админа)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { code, discount_percent, description } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Название промокода обязательно' });
    }
    const disc = parseInt(discount_percent, 10);
    if (isNaN(disc) || disc <= 0 || disc > 99) {
      return res.status(400).json({ error: 'Скидка должна быть от 1 до 99%' });
    }

    const result = await db.query(`
      INSERT INTO coupons (code, name, discount_percent, description, is_active)
      VALUES ($1, $1, $2, $3, true)
      RETURNING *
    `, [code.trim().toUpperCase(), disc, description ? description.trim() : '']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Промокод с таким кодом уже существует' });
    }
    console.error('Ошибка создания промокода:', error);
    res.status(500).json({ error: 'Не удалось создать промокод' });
  }
});

// DELETE /api/coupons/:id - Удаление промокода (для админа)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Промокод не найден' });
    }
    res.json({ message: 'Промокод успешно удален' });
  } catch (error) {
    console.error('Ошибка удаления промокода:', error);
    res.status(500).json({ error: 'Не удалось удалить промокод' });
  }
});

// PUT /api/coupons/:id/toggle - Включение/отключение промокода (для админа)
router.put('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'UPDATE coupons SET is_active = NOT is_active WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Промокод не найден' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка изменения статуса промокода:', error);
    res.status(500).json({ error: 'Не удалось обновить промокод' });
  }
});

module.exports = router;
