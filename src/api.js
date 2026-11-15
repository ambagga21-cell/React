const TOKEN_KEY = "lavka_token";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "Не удалось связаться с сервером. Проверьте, что API запущено.",
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(data?.error || "Ошибка запроса", response.status);
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request("/auth/me"),
  getServices: () => request("/services"),
  getCategories: () => request("/categories"),
  createCategory: (name) =>
    request("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  getCoupons: () => request("/coupons"),
  getUsers: () => request("/users"),
  assignCoupon: (userId, couponId) =>
    request(`/users/${userId}/coupon`, {
      method: "PATCH",
      body: JSON.stringify({ couponId }),
    }),
  setServiceDiscount: (serviceId, discountPercent) =>
    request(`/services/${serviceId}/discount`, {
      method: "PATCH",
      body: JSON.stringify({ discountPercent }),
    }),
  checkout: (items) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify({
        items: items.map((item) => ({
          serviceId: item.id,
          quantity: item.quantity,
        })),
      }),
    }),
  getAppointments: () => request("/appointments"),
};
