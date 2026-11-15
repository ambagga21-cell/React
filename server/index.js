import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { db, verifyPassword } from "./db.js";

const PORT = Number(process.env.PORT) || 3001;
const AUTH_SECRET = process.env.AUTH_SECRET || "lavka-dev-secret";
const TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    ...CORS_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1024 * 1024) {
        reject(new HttpError(413, "Слишком большой запрос"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new HttpError(400, "Некорректный JSON в запросе"));
      }
    });

    req.on("error", reject);
  });
}

function createToken(userId) {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + TOKEN_TTL }),
  ).toString("base64url");
  const signature = createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function verifyToken(token) {
  const [payload, signature] = String(token).split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest();
  const actual = Buffer.from(signature, "base64url");

  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function mapCoupon(row) {
  if (!row?.coupon_id) {
    return null;
  }

  return {
    id: row.coupon_id,
    name: row.coupon_name,
    discountPercent: row.coupon_discount,
  };
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    coupon: mapCoupon(row),
  };
}

function mapService(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: row.price,
    discountPercent: row.discount_percent,
    categoryId: row.category_id,
    categoryName: row.category_name,
  };
}

function mapAppointment(row) {
  return {
    id: row.id,
    serviceName: row.service_name,
    userName: row.user_name,
    userEmail: row.user_email,
    quantity: row.quantity,
    price: row.price,
    serviceDiscountPercent: row.service_discount_percent,
    couponDiscountPercent: row.coupon_discount_percent,
    total: row.total,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
  };
}

const userSelect = `
  SELECT u.id, u.name, u.email, r.name AS role,
         u.coupon_id, c.name AS coupon_name,
         c.discount_percent AS coupon_discount
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN coupons c ON c.id = u.coupon_id
`;

function getUserById(id) {
  return mapUser(db.prepare(`${userSelect} WHERE u.id = ?`).get(id));
}

function getUserByEmail(email) {
  return db
    .prepare("SELECT id, password_hash FROM users WHERE email = ?")
    .get(email);
}

function getAuthUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = verifyToken(token);

  return payload ? getUserById(payload.userId) : null;
}

function requireUser(req, res) {
  const user = getAuthUser(req);

  if (!user) {
    sendJson(res, 401, { error: "Требуется авторизация" });
    return null;
  }

  return user;
}

function requireAdmin(req, res) {
  const user = requireUser(req, res);

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    sendJson(res, 403, { error: "Недостаточно прав" });
    return null;
  }

  return user;
}

function getServices() {
  return db
    .prepare(
      `SELECT s.id, s.name, s.description, s.duration_minutes, s.price,
              s.discount_percent, s.category_id, c.name AS category_name
       FROM services s
       JOIN categories c ON c.id = s.category_id
       ORDER BY s.id`,
    )
    .all()
    .map(mapService);
}

function getCategories() {
  return db.prepare("SELECT id, name FROM categories ORDER BY name").all();
}

function getUsers() {
  return db
    .prepare(`${userSelect} ORDER BY u.id`)
    .all()
    .map(mapUser);
}

function getCoupons() {
  return db
    .prepare(
      "SELECT id, name, discount_percent AS discountPercent FROM coupons ORDER BY discount_percent",
    )
    .all();
}

function getAppointments(user) {
  const condition = user.role === "admin" ? "" : "WHERE a.user_id = ?";
  const params = user.role === "admin" ? [] : [user.id];

  return db
    .prepare(
      `SELECT a.id, a.quantity, a.price, a.service_discount_percent,
              a.coupon_discount_percent, a.total, a.status, a.created_at,
              s.name AS service_name, u.name AS user_name, u.email AS user_email,
              p.status AS payment_status, p.method AS payment_method
       FROM appointments a
       JOIN services s ON s.id = a.service_id
       JOIN users u ON u.id = a.user_id
       LEFT JOIN payments p ON p.appointment_id = a.id
       ${condition}
       ORDER BY a.id DESC`,
    )
    .all(...params)
    .map(mapAppointment);
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseDiscount(value) {
  const discount = Number(value);
  return Number.isInteger(discount) && discount >= 0 && discount <= 100
    ? discount
    : null;
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", "http://localhost");
  const { pathname } = url;
  const method = req.method;

  if (pathname === "/api/auth/login" && method === "POST") {
    const body = await readBody(req);
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      throw new HttpError(400, "Укажите email и пароль");
    }

    const row = getUserByEmail(email);

    if (!row || !verifyPassword(password, row.password_hash)) {
      throw new HttpError(401, "Неверный email или пароль");
    }

    const user = getUserById(row.id);
    sendJson(res, 200, { token: createToken(row.id), user });
    return;
  }

  if (pathname === "/api/auth/me" && method === "GET") {
    const user = requireUser(req, res);

    if (user) {
      sendJson(res, 200, { user });
    }
    return;
  }

  if (pathname === "/api/services" && method === "GET") {
    sendJson(res, 200, { services: getServices() });
    return;
  }

  if (pathname === "/api/categories" && method === "GET") {
    sendJson(res, 200, { categories: getCategories() });
    return;
  }

  if (pathname === "/api/categories" && method === "POST") {
    if (!requireAdmin(req, res)) {
      return;
    }

    const body = await readBody(req);
    const name = String(body.name || "").trim();

    if (name.length < 2 || name.length > 60) {
      throw new HttpError(
        400,
        "Название категории должно содержать от 2 до 60 символов",
      );
    }

    try {
      const result = db
        .prepare("INSERT INTO categories (name) VALUES (?)")
        .run(name);
      sendJson(res, 201, {
        category: { id: Number(result.lastInsertRowid), name },
      });
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        throw new HttpError(409, "Такая категория уже существует");
      }

      throw error;
    }
    return;
  }

  if (pathname === "/api/coupons" && method === "GET") {
    if (!requireAdmin(req, res)) {
      return;
    }

    sendJson(res, 200, { coupons: getCoupons() });
    return;
  }

  if (pathname === "/api/users" && method === "GET") {
    if (!requireAdmin(req, res)) {
      return;
    }

    sendJson(res, 200, { users: getUsers() });
    return;
  }

  const userCouponMatch = pathname.match(/^\/api\/users\/(\d+)\/coupon$/);

  if (userCouponMatch && method === "PATCH") {
    if (!requireAdmin(req, res)) {
      return;
    }

    const userId = parseId(userCouponMatch[1]);
    const body = await readBody(req);
    const couponId = body.couponId === null ? null : parseId(body.couponId);

    if (body.couponId !== null && couponId === null) {
      throw new HttpError(400, "Некорректный идентификатор купона");
    }

    if (!getUserById(userId)) {
      throw new HttpError(404, "Пользователь не найден");
    }

    if (couponId !== null && !db.prepare("SELECT id FROM coupons WHERE id = ?").get(couponId)) {
      throw new HttpError(404, "Купон не найден");
    }

    db.prepare("UPDATE users SET coupon_id = ? WHERE id = ?").run(
      couponId,
      userId,
    );
    sendJson(res, 200, { user: getUserById(userId) });
    return;
  }

  const serviceDiscountMatch = pathname.match(
    /^\/api\/services\/(\d+)\/discount$/,
  );

  if (serviceDiscountMatch && method === "PATCH") {
    if (!requireAdmin(req, res)) {
      return;
    }

    const serviceId = parseId(serviceDiscountMatch[1]);
    const body = await readBody(req);
    const discountPercent = parseDiscount(body.discountPercent);

    if (discountPercent === null) {
      throw new HttpError(
        400,
        "Скидка должна быть целым числом от 0 до 100",
      );
    }

    const service = db
      .prepare("SELECT id FROM services WHERE id = ?")
      .get(serviceId);

    if (!service) {
      throw new HttpError(404, "Услуга не найдена");
    }

    db.prepare("UPDATE services SET discount_percent = ? WHERE id = ?").run(
      discountPercent,
      serviceId,
    );
    sendJson(res, 200, {
      service: getServices().find((item) => item.id === serviceId),
    });
    return;
  }

  if (pathname === "/api/orders" && method === "POST") {
    const user = requireUser(req, res);

    if (!user) {
      return;
    }

    const body = await readBody(req);

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new HttpError(400, "Корзина пуста");
    }

    const quantities = new Map();

    for (const item of body.items) {
      const serviceId = parseId(item.serviceId);
      const quantity = Number(item.quantity);

      if (
        serviceId === null ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      ) {
        throw new HttpError(400, "Некорректные данные корзины");
      }

      quantities.set(serviceId, (quantities.get(serviceId) || 0) + quantity);
    }

    const couponPercent = user.coupon?.discountPercent || 0;
    const insertAppointment = db.prepare(
      `INSERT INTO appointments
         (user_id, service_id, quantity, price, service_discount_percent,
          coupon_discount_percent, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
    );
    const insertPayment = db.prepare(
      `INSERT INTO payments (appointment_id, user_id, amount, method, status)
       VALUES (?, ?, ?, 'card', 'paid')`,
    );
    const created = [];

    db.exec("BEGIN");

    try {
      for (const [serviceId, quantity] of quantities) {
        const service = db
          .prepare(
            "SELECT id, name, price, discount_percent FROM services WHERE id = ?",
          )
          .get(serviceId);

        if (!service) {
          throw new HttpError(400, "Одна из услуг не найдена");
        }

        const base = service.price * quantity;
        const serviceDiscount = Math.round(
          (base * service.discount_percent) / 100,
        );
        const afterServiceDiscount = base - serviceDiscount;
        const couponDiscount = Math.round(
          (afterServiceDiscount * couponPercent) / 100,
        );
        const total = afterServiceDiscount - couponDiscount;
        const result = insertAppointment.run(
          user.id,
          service.id,
          quantity,
          service.price,
          service.discount_percent,
          couponPercent,
          total,
        );
        const appointmentId = Number(result.lastInsertRowid);

        insertPayment.run(appointmentId, user.id, total);
        created.push({
          id: appointmentId,
          serviceName: service.name,
          quantity,
          total,
        });
      }

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    sendJson(res, 201, {
      message: "Записи оформлены",
      total: created.reduce((sum, item) => sum + item.total, 0),
      appointments: created,
    });
    return;
  }

  if (pathname === "/api/appointments" && method === "GET") {
    const user = requireUser(req, res);

    if (user) {
      sendJson(res, 200, { appointments: getAppointments(user) });
    }
    return;
  }

  sendJson(res, 404, { error: "Маршрут не найден" });
}

const server = createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    if (res.headersSent) {
      res.end();
      return;
    }

    const status = error instanceof HttpError ? error.status : 500;

    if (status === 500) {
      console.error(error);
    }

    sendJson(res, status, {
      error: status === 500 ? "Внутренняя ошибка сервера" : error.message,
    });
  });
});

server.listen(PORT, () => {
  console.log(`API запущено на http://localhost:${PORT}`);
});
