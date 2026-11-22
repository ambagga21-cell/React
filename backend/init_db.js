const db = require('./db');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('[DB Init] Проверка и создание структуры таблиц...');

    // 1. Roles
    await db.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      )
    `);

    // 2. Users
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        role_id INT REFERENCES roles(id),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone VARCHAR(30),
        default_address TEXT,
        security_question TEXT,
        security_answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Убедимся, что новые колонки присутствуют
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS default_address TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer TEXT`);

    // 3. Categories
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT
      )
    `);
    await db.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT`);

    // 4. Services
    await db.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        category_id INT REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        duration_minutes INT NOT NULL DEFAULT 60,
        price NUMERIC(10, 2) NOT NULL DEFAULT 1000,
        discount_percent INT DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 0`);
    await db.query(`
      ALTER TABLE services DROP CONSTRAINT IF EXISTS services_category_id_fkey;
      ALTER TABLE services ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
    `);

    // 5. Cart Items (хранится в БД, привязана к пользователю)
    await db.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        service_id INT REFERENCES services(id) ON DELETE CASCADE,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_cart_user_service UNIQUE (user_id, service_id)
      )
    `);

    // 6. Orders
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        delivery_address TEXT NOT NULL,
        delivery_date DATE NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Принят',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Order Items
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        service_id INT REFERENCES services(id) ON DELETE RESTRICT,
        quantity INT NOT NULL DEFAULT 1,
        price_at_order NUMERIC(10, 2) NOT NULL
      )
    `);

    // 8. Reviews
    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        service_id INT REFERENCES services(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Password Reset Codes (для восстановления пароля по Email)
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Наполнение ролей
    await db.query(`INSERT INTO roles (name) VALUES ('admin'), ('user') ON CONFLICT (name) DO NOTHING`);

    const adminRoleRes = await db.query(`SELECT id FROM roles WHERE name = 'admin'`);
    const userRoleRes = await db.query(`SELECT id FROM roles WHERE name = 'user'`);
    const adminRoleId = adminRoleRes.rows[0].id;
    const userRoleId = userRoleRes.rows[0].id;

    // Наполнение тестовых пользователей (пароль 123456)
    const hash = await bcrypt.hash('123456', 10);

    await db.query(`
      INSERT INTO users (role_id, name, email, password_hash, phone, default_address, security_question, security_answer)
      VALUES 
        ($1, 'Администратор салона', 'admin@lavka.ru', $3, '+7 (999) 111-22-33', 'г. Москва, ул. Тверская, д. 12', 'Любимый цвет', 'синий'),
        ($2, 'Александр Иванов', 'user@lavka.ru', $3, '+7 (999) 777-88-99', 'г. Москва, пр-т Мира, д. 25, кв. 42', 'Кличка первого питомца', 'Барсик'),
        ($2, 'Александр (Студент)', 'ambagga21@gmail.com', $3, '+7 (999) 888-21-21', 'г. Москва, ул. Арбат, д. 21', 'Любимый цвет', 'синий')
      ON CONFLICT (email) DO UPDATE SET 
        role_id = EXCLUDED.role_id,
        password_hash = EXCLUDED.password_hash,
        phone = CASE WHEN users.phone IS NULL OR users.phone = '12345' OR length(regexp_replace(users.phone, '\D', '', 'g')) < 11 THEN EXCLUDED.phone ELSE users.phone END,
        default_address = COALESCE(users.default_address, EXCLUDED.default_address),
        security_question = COALESCE(users.security_question, EXCLUDED.security_question),
        security_answer = COALESCE(users.security_answer, EXCLUDED.security_answer)
    `, [adminRoleId, userRoleId, hash]);

    // Наполнение категорий
    const cats = [
      ['Парикмахерские услуги', 'Стрижки, окрашивания, авторские укладки'],
      ['Маникюр и педикюр', 'Уход за ногтями, стойкое покрытие и спа-процедуры'],
      ['Массаж', 'Классический, антистресс и оздоровительный массаж'],
      ['Косметология', 'Аппаратный уход, чистки лица и питательные маски']
    ];

    for (const [name, desc] of cats) {
      await db.query(`
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
      `, [name, desc]);
    }

    const catMapRes = await db.query(`SELECT id, name FROM categories`);
    const catMap = {};
    catMapRes.rows.forEach(r => { catMap[r.name] = r.id; });

    // Наполнение услуг
    const initialServices = [
      {
        cat: 'Парикмахерские услуги',
        name: 'Женская модельная стрижка',
        desc: 'Мытье головы профессиональными средствами, стрижка по форме лица и укладка феном с брашингом.',
        duration: 60,
        price: 2200,
        img: '/images/services/female_haircut.jpg'
      },
      {
        cat: 'Парикмахерские услуги',
        name: 'Мужская стрижка и оформление бороды',
        desc: 'Классическая стрижка ножницами и машинкой, мытье головы, стайлинг и коррекция контуров бороды.',
        duration: 45,
        price: 1500,
        img: '/images/services/male_haircut.jpg'
      },
      {
        cat: 'Парикмахерские услуги',
        name: 'Сложное окрашивание (Airtouch / Balayage)',
        desc: 'Премиальное бережное осветление, тонирование и уход для сияния волос.',
        duration: 180,
        price: 5500,
        img: '/images/services/coloring.jpg'
      },
      {
        cat: 'Парикмахерские услуги',
        name: 'Праздничная укладка волос',
        desc: 'Создание вечернего образа, объемных локонов или гладкого пучка со стойкой фиксацией.',
        duration: 60,
        price: 2500,
        img: '/images/services/styling.jpg'
      },
      {
        cat: 'Маникюр и педикюр',
        name: 'Комбинированный маникюр с покрытием гель-лак',
        desc: 'Аппаратная обработка кутикулы, придание формы ногтям, выравнивание базой и стойкое покрытие в цвет.',
        duration: 90,
        price: 1800,
        img: '/images/services/manicure.jpg'
      },
      {
        cat: 'Маникюр и педикюр',
        name: 'Smart-педикюр с обработкой стоп',
        desc: 'Бережная аппаратная шлифовка стоп дисками, уход за ногтями, увлажнение питательным кремом.',
        duration: 90,
        price: 2600,
        img: '/images/services/pedicure.jpg'
      },
      {
        cat: 'Массаж',
        name: 'Общий расслабляющий массаж тела',
        desc: 'Снятие мышечного напряжения, улучшение лимфотока с использованием ароматических натуральных масел.',
        duration: 60,
        price: 3200,
        img: '/images/services/body_massage.jpg'
      },
      {
        cat: 'Массаж',
        name: 'Оздоровительный массаж спины и ШВЗ',
        desc: 'Глубокая проработка мышц спины, шейно-воротниковой зоны и плечевого пояса при усталости.',
        duration: 45,
        price: 2100,
        img: '/images/services/back_massage.jpg'
      },
      {
        cat: 'Косметология',
        name: 'Ультразвуковая комбинированная чистка лица',
        desc: 'Очищение пор, деликатный пилинг, распаривание гелем и завершающая успокаивающая сыворотка.',
        duration: 60,
        price: 2800,
        img: '/images/services/facial_cleaning.jpg'
      },
      {
        cat: 'Косметология',
        name: 'Всесезонный миндальный пилинг',
        desc: 'Мягкое обновление верхнего слоя кожи, выравнивание тона, придание свежести и естественного сияния.',
        duration: 45,
        price: 3100,
        img: '/images/services/facial_peeling.jpg'
      }
    ];

    for (const s of initialServices) {
      const catId = catMap[s.cat];
      if (catId) {
        const check = await db.query('SELECT id FROM services WHERE name = $1', [s.name]);
        if (check.rows.length === 0) {
          await db.query(`
            INSERT INTO services (category_id, name, description, duration_minutes, price, image_url)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [catId, s.name, s.desc, s.duration, s.price, s.img]);
        }
      }
    }

    // Проставим скидки на популярные услуги, чтобы в каталоге сразу были скидочные предложения
    await db.query(`
      UPDATE services SET discount_percent = 15 WHERE id = 2 AND (discount_percent IS NULL OR discount_percent = 0);
      UPDATE services SET discount_percent = 20 WHERE id = 4 AND (discount_percent IS NULL OR discount_percent = 0);
      UPDATE services SET discount_percent = 25 WHERE id = 6 AND (discount_percent IS NULL OR discount_percent = 0);
      UPDATE services SET discount_percent = 20 WHERE id = 8 AND (discount_percent IS NULL OR discount_percent = 0);
      UPDATE services SET discount_percent = 30 WHERE id = 10 AND (discount_percent IS NULL OR discount_percent = 0);
    `);

    // Добавим отзывы, если таблица пуста
    const reviewsCount = await db.query('SELECT COUNT(*) FROM reviews');
    if (parseInt(reviewsCount.rows[0].count, 10) === 0) {
      const userRes = await db.query(`SELECT id FROM users WHERE email = 'user@lavka.ru'`);
      const sampleServ = await db.query(`SELECT id, name FROM services LIMIT 10`);
      if (userRes.rows.length > 0 && sampleServ.rows.length > 0) {
        const uid = userRes.rows[0].id;
        const s1 = sampleServ.rows[0]?.id;
        const s2 = sampleServ.rows[1]?.id || s1;
        const s3 = sampleServ.rows[2]?.id || s1;
        await db.query(`
          INSERT INTO reviews (service_id, user_id, rating, comment)
          VALUES 
            ($1, $2, 5, 'Отличная стрижка! Мастер учел все пожелания, волосы лежат идеально.'),
            ($3, $2, 4, 'Хорошая работа мастера, аккуратная окантовка. Немного пришлось подождать, но результат отличный.'),
            ($1, $2, 4, 'Стрижка хорошая, мастер очень вежливый. Единственное — мастер состриг чуть больше, чем просила.'),
            ($4, $2, 5, 'Маникюр продержался почти месяц без единого скола. Очень доволен сервисом!'),
            ($4, $2, 3, 'Покрытие красивое, но процедура заняла почти два часа вместо одного.')
        `, [s1, uid, s2, s3]);
      }
    }

    console.log('[DB Init] База данных успешно инициализирована!');
  } catch (error) {
    console.error('[DB Init] Ошибка инициализации БД:', error);
  }
}

if (require.main === module) {
  initDatabase().then(() => process.exit(0));
}

module.exports = initDatabase;
