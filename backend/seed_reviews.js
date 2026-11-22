const db = require('./db');

async function seedReviews() {
  try {
    const userRes = await db.query("SELECT id FROM users WHERE email = 'user@lavka.ru'");
    if (userRes.rows.length === 0) {
      console.error('User not found');
      process.exit(1);
    }
    const uid = userRes.rows[0].id;

    // Проверяем существующие сервисы
    const servRes = await db.query("SELECT id, name FROM services");
    const servMap = {};
    servRes.rows.forEach(s => { servMap[s.name] = s.id; });

    const reviewsToAdd = [
      { name: 'Женская стрижка', rating: 4, comment: 'Стрижка хорошая, мастер очень вежливый. Единственное — пришлось подождать 10 минут перед началом сеанса.' },
      { name: 'Женская стрижка', rating: 3, comment: 'В целом нормально, но ожидала чуть большей длины, мастер состриг немного больше, чем просила.' },
      { name: 'Мужская стрижка', rating: 4, comment: 'Хорошая классическая мужская стрижка, аккуратная окантовка. Немного долго, но результат отличный.' },
      { name: 'Окрашивание волос', rating: 4, comment: 'Цвет получился очень красивый, как на фото. Краска качественная, кожу головы не щипало.' },
      { name: 'Окрашивание волос', rating: 3, comment: 'Оттенок получился чуть темнее желаемого, но через пару смывок стало лучше.' },
      { name: 'Маникюр', rating: 4, comment: 'Качественная обработка кутикулы и аккуратное покрытие. Мастер работала очень старательно.' },
      { name: 'Маникюр', rating: 3, comment: 'Покрытие красивое, но процедура заняла почти два часа вместо заявленного одного.' },
      { name: 'Массаж спины', rating: 4, comment: 'Отличный сильный массаж, зажимы в шее ушли. В кабинете было чуть прохладно.' },
      { name: 'Чистка лица', rating: 4, comment: 'Кожа стала заметно чище и свежее. Первые пару дней были небольшие покраснения, потом всё прошло.' },
      { name: 'Чистка лица', rating: 3, comment: 'Процедура достаточно чувствительная, хотя результат неплохой. Хотелось бы больше успокаивающей маски в конце.' }
    ];

    for (const r of reviewsToAdd) {
      const sId = servMap[r.name];
      if (sId) {
        // Проверяем, нет ли уже такого комментария
        const exists = await db.query("SELECT id FROM reviews WHERE comment = $1", [r.comment]);
        if (exists.rows.length === 0) {
          await db.query(
            "INSERT INTO reviews (service_id, user_id, rating, comment) VALUES ($1, $2, $3, $4)",
            [sId, uid, r.rating, r.comment]
          );
        }
      }
    }

    const counts = await db.query("SELECT rating, COUNT(*) FROM reviews GROUP BY rating ORDER BY rating DESC");
    console.log("Отзывы в базе данных по оценкам:", counts.rows);
    process.exit(0);
  } catch (err) {
    console.error("Ошибка при добавлении отзывов:", err);
    process.exit(1);
  }
}

seedReviews();
