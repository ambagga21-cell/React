const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { checkProfanity } = require('../utils/profanityFilter');

// GET /api/reviews/service/:service_id - Получение всех отзывов по услуге (через JOIN с пользователем, с поддержкой поиска и фильтрации по оценке)
router.get('/service/:service_id', async (req, res) => {
  try {
    const { service_id } = req.params;
    const { search, rating } = req.query;

    let queryText = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.name AS author_name,
        s.name AS service_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      WHERE r.service_id = $1
    `;
    const params = [service_id];
    let pIdx = 2;

    if (rating && rating !== 'all') {
      queryText += ` AND r.rating = $${pIdx}`;
      params.push(Number(rating));
      pIdx++;
    }

    if (search && search.trim()) {
      queryText += ` AND (LOWER(r.comment) LIKE $${pIdx} OR LOWER(u.name) LIKE $${pIdx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }

    queryText += ` ORDER BY r.created_at DESC`;

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    res.status(500).json({ error: 'Не удалось загрузить отзывы' });
  }
});

// POST /api/reviews - Добавление отзыва (только для авторизованных пользователей)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { service_id, rating, comment } = req.body;

    if (!service_id) {
      return res.status(400).json({ error: 'Не указана услуга' });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Оценка должна быть числом от 1 до 5 звезд' });
    }

    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({ error: 'Текст отзыва должен содержать не менее 3 символов' });
    }

    // Проверка на нецензурную лексику (в т.ч. транслит)
    const profCheck = checkProfanity(comment);
    if (profCheck.hasProfanity) {
      return res.status(400).json({ error: profCheck.error });
    }

    // Проверяем существование услуги
    const sCheck = await db.query('SELECT id, name FROM services WHERE id = $1', [service_id]);
    if (sCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    const insertRes = await db.query(`
      INSERT INTO reviews (service_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING id, rating, comment, created_at
    `, [service_id, req.user.id, ratingNum, comment.trim()]);

    const newRev = insertRes.rows[0];

    // Возвращаем отзыв с именем автора через JOIN
    const fullReviewRes = await db.query(`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.name AS author_name,
        s.name AS service_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      WHERE r.id = $1
    `, [newRev.id]);

    res.status(201).json(fullReviewRes.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления отзыва:', error);
    res.status(500).json({ error: 'Не удалось сохранить отзыв' });
  }
});

module.exports = router;
