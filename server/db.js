import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const serverDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(serverDir, "data");

mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, "shop.sqlite"));

db.exec("PRAGMA foreign_keys = ON;");
db.exec(readFileSync(join(serverDir, "schema.sql"), "utf8"));

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);

  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}

function seedDatabase() {
  const roles = [
    { name: "admin", title: "Администратор" },
    { name: "user", title: "Клиент" },
  ];

  const coupons = [
    { name: "Старт", discountPercent: 5 },
    { name: "Постоянный клиент", discountPercent: 10 },
    { name: "VIP", discountPercent: 15 },
    { name: "Праздничная", discountPercent: 20 },
  ];

  const categories = [
    "Парикмахерские услуги",
    "Маникюр и педикюр",
    "Массаж",
    "Косметология",
    "Барбершоп",
  ];

  const services = [
    {
      category: "Парикмахерские услуги",
      name: "Женская стрижка",
      description: "Стрижка с укладкой и консультацией по уходу за волосами.",
      durationMinutes: 60,
      price: 2500,
      discountPercent: 0,
    },
    {
      category: "Барбершоп",
      name: "Мужская стрижка",
      description: "Классическая стрижка машинкой и ножницами, укладка.",
      durationMinutes: 45,
      price: 1800,
      discountPercent: 0,
    },
    {
      category: "Парикмахерские услуги",
      name: "Укладка волос",
      description: "Вечерняя или повседневная укладка с использованием стайлинга.",
      durationMinutes: 40,
      price: 1500,
      discountPercent: 0,
    },
    {
      category: "Парикмахерские услуги",
      name: "Окрашивание волос",
      description: "Однотонное окрашивание профессиональными красителями.",
      durationMinutes: 120,
      price: 6000,
      discountPercent: 15,
    },
    {
      category: "Маникюр и педикюр",
      name: "Маникюр",
      description: "Аппаратный маникюр, уход за кутикулой и покрытие лаком.",
      durationMinutes: 60,
      price: 2200,
      discountPercent: 0,
    },
    {
      category: "Маникюр и педикюр",
      name: "Педикюр",
      description: "Аппаратный педикюр с обработкой стоп и покрытием лаком.",
      durationMinutes: 90,
      price: 3000,
      discountPercent: 0,
    },
    {
      category: "Массаж",
      name: "Массаж спины",
      description: "Расслабляющий массаж спины и шейно-воротниковой зоны.",
      durationMinutes: 60,
      price: 3500,
      discountPercent: 20,
    },
    {
      category: "Массаж",
      name: "Общий массаж тела",
      description: "Массаж всего тела для снятия напряжения и усталости.",
      durationMinutes: 90,
      price: 5000,
      discountPercent: 0,
    },
    {
      category: "Косметология",
      name: "Чистка лица",
      description: "Комбинированная чистка лица с уходовой маской.",
      durationMinutes: 60,
      price: 4000,
      discountPercent: 0,
    },
    {
      category: "Косметология",
      name: "Пилинг лица",
      description: "Химический пилинг для обновления и выравнивания кожи.",
      durationMinutes: 45,
      price: 3200,
      discountPercent: 10,
    },
  ];

  db.exec("BEGIN");

  try {
    const insertRole = db.prepare("INSERT INTO roles (name) VALUES (?)");
    const roleIds = new Map();

    for (const role of roles) {
      const result = insertRole.run(role.name);
      roleIds.set(role.name, Number(result.lastInsertRowid));
    }

    const insertCoupon = db.prepare(
      "INSERT INTO coupons (name, discount_percent) VALUES (?, ?)",
    );
    const couponIds = new Map();

    for (const coupon of coupons) {
      const result = insertCoupon.run(coupon.name, coupon.discountPercent);
      couponIds.set(coupon.name, Number(result.lastInsertRowid));
    }

    const insertUser = db.prepare(
      `INSERT INTO users (role_id, coupon_id, name, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
    );

    insertUser.run(
      roleIds.get("admin"),
      null,
      "Администратор",
      "admin@lavka.ru",
      hashPassword("admin123"),
    );
    insertUser.run(
      roleIds.get("user"),
      couponIds.get("Постоянный клиент"),
      "Александр",
      "user@lavka.ru",
      hashPassword("user123"),
    );
    insertUser.run(
      roleIds.get("user"),
      couponIds.get("VIP"),
      "Анна",
      "anna@lavka.ru",
      hashPassword("anna123"),
    );

    const insertCategory = db.prepare(
      "INSERT INTO categories (name) VALUES (?)",
    );
    const categoryIds = new Map();

    for (const category of categories) {
      const result = insertCategory.run(category);
      categoryIds.set(category, Number(result.lastInsertRowid));
    }

    const insertService = db.prepare(
      `INSERT INTO services
         (category_id, name, description, duration_minutes, price, discount_percent)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    for (const service of services) {
      insertService.run(
        categoryIds.get(service.category),
        service.name,
        service.description,
        service.durationMinutes,
        service.price,
        service.discountPercent,
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

const rolesCount = Number(
  db.prepare("SELECT COUNT(*) AS count FROM roles").get().count,
);

if (rolesCount === 0) {
  seedDatabase();
}
