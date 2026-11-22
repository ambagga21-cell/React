const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/categories - Получение списка категорий с подсчетом услуг через JOIN
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        COUNT(s.id)::int AS services_count
      FROM categories c
      LEFT JOIN services s ON c.id = s.category_id
      GROUP BY c.id, c.name, c.description
      ORDER BY c.name ASC
    `);

    // Подсчитываем услуги без категории (category_id IS NULL)
    const uncatRes = await db.query(`
      SELECT COUNT(*)::int AS services_count
      FROM services
      WHERE category_id IS NULL
    `);
    const uncatCount = uncatRes.rows[0] ? parseInt(uncatRes.rows[0].services_count, 10) : 0;

    const allCategories = [...result.rows];
    if (uncatCount > 0) {
      allCategories.push({
        id: null,
        name: 'Без категории',
        description: 'Услуги без назначенной категории',
        services_count: uncatCount
      });
    }

    res.json(allCategories);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Не удалось загрузить категории' });
  }
});

// POST /api/categories - Добавление категории (только админ)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const check = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Категория с таким названием уже существует' });
    }

    const result = await db.query(`
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description
    `, [name.trim(), description ? description.trim() : '']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({ error: 'Ошибка при сохранении категории' });
  }
});

// PUT /api/categories/:id - Редактирование категории (только админ)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const result = await db.query(`
      UPDATE categories 
      SET name = $1, description = $2
      WHERE id = $3
      RETURNING id, name, description
    `, [name.trim(), description ? description.trim() : '', id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка изменения категории:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// DELETE /api/categories/:id - Удаление категории (только админ)
// Услуги не удаляются, а переводятся в раздел "Без категории" (category_id = NULL)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Сначала отвязываем все услуги от этой категории (переносим в "Без категории")
    await db.query('UPDATE services SET category_id = NULL WHERE category_id = $1', [id]);

    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    res.json({ message: 'Категория успешно удалена, услуги перенесены в раздел «Без категории»' });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Не удалось удалить категорию' });
  }
});

module.exports = router;
