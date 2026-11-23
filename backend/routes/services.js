const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/services - Каталог услуг (все данные и связи подтягиваются только через JOIN)
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, onlyDiscount } = req.query;

    let queryText = `
      SELECT 
        s.id,
        s.name, 
        s.description, 
        s.duration_minutes AS duration, 
        s.price, 
        COALESCE(s.discount_percent, 0)::int AS discount_percent,
        ROUND(s.price * (1 - COALESCE(s.discount_percent, 0)::numeric / 100), 2)::numeric(10,2) AS final_price,
        COALESCE(s.stock, 10)::int AS stock,
        s.image_url,
        COALESCE(c.name, 'Без категории') AS category_name,
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
        COUNT(r.id)::int AS reviews_count
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE 1=1
    `;

    const params = [];
    let pIdx = 1;

    // Фильтрация только со скидкой
    if (onlyDiscount === 'true' || onlyDiscount === true) {
      queryText += ` AND COALESCE(s.discount_percent, 0) > 0`;
    }

    // Фильтрация по категории (включая "Без категории")
    if (category && category !== 'all') {
      if (category === 'Без категории' || category === 'uncategorized') {
        queryText += ` AND (s.category_id IS NULL OR c.name IS NULL OR c.name = 'Без категории')`;
      } else {
        queryText += ` AND (c.name = $${pIdx} OR s.category_id::text = $${pIdx})`;
        params.push(category);
        pIdx++;
      }
    }

    // Поиск по названию или описанию
    if (search && search.trim()) {
      queryText += ` AND (LOWER(s.name) LIKE $${pIdx} OR LOWER(s.description) LIKE $${pIdx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }

    // Фильтрация по минимальной цене
    if (minPrice && !isNaN(Number(minPrice))) {
      queryText += ` AND ROUND(s.price * (1 - COALESCE(s.discount_percent, 0)::numeric / 100), 2) >= $${pIdx}`;
      params.push(Number(minPrice));
      pIdx++;
    }

    // Фильтрация по максимальной цене
    if (maxPrice && !isNaN(Number(maxPrice))) {
      queryText += ` AND ROUND(s.price * (1 - COALESCE(s.discount_percent, 0)::numeric / 100), 2) <= $${pIdx}`;
      params.push(Number(maxPrice));
      pIdx++;
    }

    queryText += ` GROUP BY s.id, c.name`;

    // Сортировка
    if (sort === 'price_asc') {
      queryText += ` ORDER BY final_price ASC`;
    } else if (sort === 'price_desc') {
      queryText += ` ORDER BY final_price DESC`;
    } else if (sort === 'rating') {
      queryText += ` ORDER BY average_rating DESC, s.name ASC`;
    } else {
      queryText += ` ORDER BY s.id ASC`;
    }

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении каталога услуг:', error);
    res.status(500).json({ error: 'Не удалось загрузить каталог услуг' });
  }
});

// GET /api/services/:id - Получение детальной информации об услуге
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT 
        s.id,
        s.name, 
        s.description, 
        s.duration_minutes AS duration, 
        s.price, 
        COALESCE(s.discount_percent, 0)::int AS discount_percent,
        ROUND(s.price * (1 - COALESCE(s.discount_percent, 0)::numeric / 100), 2)::numeric(10,2) AS final_price,
        COALESCE(s.stock, 10)::int AS stock,
        s.image_url,
        COALESCE(c.name, 'Без категории') AS category_name,
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
        COUNT(r.id)::int AS reviews_count
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.id = $1
      GROUP BY s.id, c.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения услуги:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/services - Добавление новой услуги (только админ)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { category_id, category_name, name, description, duration, price, discount_percent, stock, image_url } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Укажите название услуги' });
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: 'Цена должна быть положительным числом больше 0' });
    }

    let resolvedCatId = null;
    if (category_name === 'Без категории' || category_id === null || category_id === 'null' || category_id === 'none') {
      resolvedCatId = null;
    } else if (category_name && category_name.trim()) {
      const catRes = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [category_name.trim()]);
      if (catRes.rows.length > 0) {
        resolvedCatId = catRes.rows[0].id;
      } else {
        const newCat = await db.query(
          'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
          [category_name.trim(), 'Создана при добавлении услуги']
        );
        resolvedCatId = newCat.rows[0].id;
      }
    } else if (category_id) {
      resolvedCatId = category_id;
    }

    const durationNum = duration ? parseInt(duration, 10) : 60;
    if (isNaN(durationNum) || durationNum <= 0 || durationNum > 360) {
      return res.status(400).json({ error: 'Длительность услуги должна быть от 1 до 360 минут (максимум 6 часов работы мастера)' });
    }
    let discountNum = 0;
    if (discount_percent !== undefined && discount_percent !== null && discount_percent !== '') {
      const dNum = Number(discount_percent);
      if (isNaN(dNum) || !Number.isInteger(dNum) || dNum < 0 || dNum > 99) {
        return res.status(400).json({ error: 'Скидка должна быть целым числом в диапазоне от 0 до 99%' });
      }
      discountNum = dNum;
    }

    let stockNum = 10;
    if (stock !== undefined && stock !== null && stock !== '') {
      const sNum = parseInt(stock, 10);
      if (isNaN(sNum) || sNum < 0) {
        return res.status(400).json({ error: 'Количество на складе должно быть неотрицательным числом' });
      }
      stockNum = sNum;
    }

    const img = image_url || '/images/services/styling.jpg';

    const insertRes = await db.query(`
      INSERT INTO services (category_id, name, description, duration_minutes, price, discount_percent, stock, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, description, duration_minutes AS duration, price, discount_percent, stock, image_url
    `, [resolvedCatId, name.trim(), description ? description.trim() : '', durationNum, Number(price), discountNum, stockNum, img]);

    // Возвращаем услугу с JOIN названия категории
    const serviceWithCat = await db.query(`
      SELECT 
        s.id, s.name, s.description, s.duration_minutes AS duration, s.price,
        COALESCE(s.discount_percent, 0)::int AS discount_percent,
        ROUND(s.price * (1 - COALESCE(s.discount_percent, 0)::numeric / 100), 2)::numeric(10,2) AS final_price,
        COALESCE(s.stock, 10)::int AS stock,
        s.image_url,
        COALESCE(c.name, 'Без категории') AS category_name, 0 AS average_rating, 0 AS reviews_count
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = $1
    `, [insertRes.rows[0].id]);

    res.status(201).json(serviceWithCat.rows[0]);
  } catch (error) {
    console.error('Ошибка создания услуги:', error);
    res.status(500).json({ error: 'Не удалось сохранить услугу' });
  }
});

// PUT /api/services/:id - Редактирование услуги (только админ)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, category_name, name, description, duration, price, discount_percent, stock, image_url } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Укажите название услуги' });
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: 'Цена должна быть положительным числом больше 0' });
    }

    let resolvedCatId = undefined;
    if (category_name !== undefined || category_id !== undefined) {
      if (category_name === 'Без категории' || category_name === 'none' || category_id === null || category_id === 'null' || category_id === '') {
        resolvedCatId = null;
      } else if (category_name && category_name.trim()) {
        const catRes = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [category_name.trim()]);
        if (catRes.rows.length > 0) {
          resolvedCatId = catRes.rows[0].id;
        } else {
          const newCat = await db.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
            [category_name.trim(), 'Создана при редактировании услуги']
          );
          resolvedCatId = newCat.rows[0].id;
        }
      } else if (category_id) {
        resolvedCatId = category_id;
      }
    }

    let durationNum = null;
    if (duration !== undefined && duration !== null) {
      const dNum = parseInt(duration, 10);
      if (isNaN(dNum) || dNum <= 0 || dNum > 360) {
        return res.status(400).json({ error: 'Длительность услуги должна быть от 1 до 360 минут (максимум 6 часов работы мастера)' });
      }
      durationNum = dNum;
    }

    let discountNum = null;
    if (discount_percent !== undefined && discount_percent !== null && discount_percent !== '') {
      const dNum = Number(discount_percent);
      if (isNaN(dNum) || !Number.isInteger(dNum) || dNum < 0 || dNum > 99) {
        return res.status(400).json({ error: 'Скидка должна быть целым числом в диапазоне от 0 до 99%' });
      }
      discountNum = dNum;
    }

    let stockNum = null;
    if (stock !== undefined && stock !== null && stock !== '') {
      const sNum = parseInt(stock, 10);
      if (isNaN(sNum) || sNum < 0) {
        return res.status(400).json({ error: 'Количество на складе должно быть неотрицательным числом' });
      }
      stockNum = sNum;
    }

    const updateRes = await db.query(`
      UPDATE services 
      SET 
        category_id = CASE WHEN $1::boolean THEN $2::int ELSE category_id END,
        name = $3,
        description = $4,
        duration_minutes = $5,
        price = $6,
        discount_percent = COALESCE($7, discount_percent),
        stock = COALESCE($8, stock),
        image_url = COALESCE($9, image_url)
      WHERE id = $10
      RETURNING id
    `, [
      resolvedCatId !== undefined,
      resolvedCatId !== undefined ? resolvedCatId : null,
      name.trim(),
      description ? description.trim() : '',
      durationNum !== null ? durationNum : 60,
      Number(price),
      discountNum,
      stockNum,
      image_url || null,
      id
    ]);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }

    const serviceWithCat = await db.query(`
      SELECT 
        s.id, s.name, s.description, s.duration_minutes AS duration, s.price, s.image_url,
        COALESCE(s.discount_percent, 0)::int AS discount_percent,
        ROUND(s.price * (1 - COALESCE(s.discount_percent, 0)::numeric / 100), 2)::numeric(10,2) AS final_price,
        COALESCE(c.name, 'Без категории') AS category_name,
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
        COUNT(r.id)::int AS reviews_count
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.id = $1
      GROUP BY s.id, c.name
    `, [id]);

    res.json(serviceWithCat.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления услуги:', error);
    res.status(500).json({ error: 'Не удалось обновить услугу' });
  }
});

// DELETE /api/services/:id - Удаление услуги (только админ)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM services WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    res.json({ message: 'Услуга успешно удалена' });
  } catch (error) {
    console.error('Ошибка удаления услуги:', error);
    res.status(500).json({ error: 'Не удалось удалить услугу' });
  }
});

module.exports = router;
