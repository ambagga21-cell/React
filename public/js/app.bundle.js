
// Скомпилированный бандл React 18 приложения «Эстетика & Сервис»
(function() {
  const { useState, useEffect, useCallback, useMemo, useRef } = React;
  window.React = React;
  window.ReactDOM = ReactDOM;

  // Общая функция заголовков с токеном авторизации
  function getHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    return headers;
  }

  // Общая функция форматирования времени (часы и минуты)
  function formatDuration(totalMinutes) {
    const mins = parseInt(totalMinutes, 10) || 0;
    if (mins <= 0) return '0 мин';
    const hours = Math.floor(mins / 60);
    const remainderMinutes = mins % 60;
    if (hours === 0) return remainderMinutes + ' мин';
    let hourStr = 'часов';
    const lastH = hours % 10;
    const last10H = hours % 100;
    if (lastH === 1 && last10H !== 11) {
      hourStr = 'час';
    } else if ([2, 3, 4].includes(lastH) && ![12, 13, 14].includes(last10H)) {
      hourStr = 'часа';
    }
    if (remainderMinutes === 0) return hours + ' ' + hourStr;
    return hours + ' ' + hourStr + ' ' + remainderMinutes + ' мин';
  }

  // Расчет итоговой цены со скидкой (с точностью до копеек)
  function calculateFinalPrice(price, discountPercent) {
    const p = Number(price) || 0;
    const d = Number(discountPercent) || 0;
    if (d <= 0) return p;
    return Math.round(p * (1 - d / 100) * 100) / 100;
  }

  // Форматирование цены в рублях (целые числа без дробной части, копейки с 2 знаками)
  function formatPrice(value) {
    const num = Number(value);
    if (isNaN(num)) return '0 ₽';
    const hasFractions = num % 1 !== 0;
    if (hasFractions) {
      return num.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' ₽';
    }
    return num.toLocaleString('ru-RU') + ' ₽';
  }

// Util: formatters.js
// Утилиты форматирования для пользовательского интерфейса

// Форматирование времени: отображение в часах и минутах
// Например: 60 -> "1 час", 90 -> "1 час 30 мин", 120 -> "2 часа", 45 -> "45 мин"
function formatDuration(totalMinutes) {
  const mins = parseInt(totalMinutes, 10) || 0;
  if (mins <= 0) return '0 мин';
  const hours = Math.floor(mins / 60);
  const remainderMinutes = mins % 60;

  if (hours === 0) {
    return `${remainderMinutes} мин`;
  }

  let hourStr = 'часов';
  const lastH = hours % 10;
  const last10H = hours % 100;
  if (lastH === 1 && last10H !== 11) {
    hourStr = 'час';
  } else if ([2, 3, 4].includes(lastH) && ![12, 13, 14].includes(last10H)) {
    hourStr = 'часа';
  }

  if (remainderMinutes === 0) {
    return `${hours} ${hourStr}`;
  }

  return `${hours} ${hourStr} ${remainderMinutes} мин`;
}

// Расчет итоговой цены с учетом скидки (с точностью до копеек)
function calculateFinalPrice(price, discountPercent) {
  const p = Number(price) || 0;
  const d = Number(discountPercent) || 0;
  if (d <= 0) return p;
  return Math.round(p * (1 - d / 100) * 100) / 100;
}

// Форматирование цены в рублях (целые числа без дроби, копейки с 2 знаками)
// Например: 2500 -> "2 500 ₽", 0.01 -> "0,01 ₽"
function formatPrice(value) {
  const num = Number(value);
  if (isNaN(num)) return '0 ₽';
  const hasFractions = num % 1 !== 0;
  if (hasFractions) {
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ₽';
  }
  return num.toLocaleString('ru-RU') + ' ₽';
}


// API: auth.js
const AUTH_API_URL = 'http://localhost:3001/api/auth';

// Форматирование телефонного номера: строго 11 цифр, маска +7 (XXX) XXX-XX-XX
function formatPhoneNumber(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (!digits || digits === '7' || digits === '8') {
    if (String(val).length <= 3) return '';
  }
  if (!digits) return '';
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  } else if (!digits.startsWith('7')) {
    digits = '7' + digits;
  }
  digits = digits.slice(0, 11);

  let res = '+7';
  if (digits.length > 1) {
    res += ' (' + digits.slice(1, 4);
  }
  if (digits.length >= 4) {
    res += ') ' + digits.slice(4, 7);
  }
  if (digits.length >= 7) {
    res += '-' + digits.slice(7, 9);
  }
  if (digits.length >= 9) {
    res += '-' + digits.slice(9, 11);
  }
  return res;
}



async function loginUser(email, password) {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при входе');
  }
  return data;
}

async function registerUser(userData) {
  const response = await fetch(`${AUTH_API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при регистрации');
  }
  return data;
}

async function getMe() {
  const response = await fetch(`${AUTH_API_URL}/me`, {
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось получить данные профиля');
  }
  return data.user;
}

async function sendPasswordResetCode(email) {
  const response = await fetch(`${AUTH_API_URL}/forgot-password/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка отправки кода на почту');
  }
  return data;
}

async function resetPasswordWithEmailCode(email, code, new_password) {
  const response = await fetch(`${AUTH_API_URL}/forgot-password/reset-with-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, new_password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка сброса пароля');
  }
  return data;
}

async function getForgotQuestion(email) {
  const response = await fetch(`${AUTH_API_URL}/forgot-password/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка проверки email');
  }
  return data.question;
}

async function resetPasswordWithAnswer(email, security_answer, new_password) {
  const response = await fetch(`${AUTH_API_URL}/forgot-password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, security_answer, new_password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка сброса пароля');
  }
  return data;
}

async function updateProfile(profileData) {
  const response = await fetch(`${AUTH_API_URL}/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(profileData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка обновления профиля');
  }
  return data;
}

async function changePassword(old_password, new_password) {
  const response = await fetch(`${AUTH_API_URL}/change-password`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ old_password, new_password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка смены пароля');
  }
  return data;
}


// API: services.js
const SERVICES_API_URL = 'http://localhost:3001/api/services';



async function getServices(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') {
    params.append('category', filters.category);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.minPrice) {
    params.append('minPrice', filters.minPrice);
  }
  if (filters.maxPrice) {
    params.append('maxPrice', filters.maxPrice);
  }
  if (filters.sort) {
    params.append('sort', filters.sort);
  }

  const url = params.toString() ? `${SERVICES_API_URL}?${params.toString()}` : SERVICES_API_URL;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Ошибка при получении каталога услуг');
  }
  const data = await response.json();
  // Поддержка как прямого массива услуг, так и объекта { services: [...] }
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.services)) {
    return data.services;
  }
  return [];
}

async function getServiceById(id) {
  const response = await fetch(`${SERVICES_API_URL}/${id}`);
  if (!response.ok) {
    throw new Error('Ошибка при получении информации об услуге');
  }
  return await response.json();
}

async function createService(serviceData) {
  const response = await fetch(SERVICES_API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(serviceData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при добавлении услуги');
  }
  return data;
}

async function updateService(id, serviceData) {
  const response = await fetch(`${SERVICES_API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(serviceData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при обновлении услуги');
  }
  return data;
}

async function deleteService(id) {
  const response = await fetch(`${SERVICES_API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при удалении услуги');
  }
  return data;
}


// API: categories.js
const CATEGORIES_API_URL = 'http://localhost:3001/api/categories';



async function getCategories() {
  const response = await fetch(CATEGORIES_API_URL);
  if (!response.ok) {
    throw new Error('Ошибка при получении категорий');
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.categories)) {
    return data.categories;
  }
  return [];
}

async function createCategory(categoryData) {
  const response = await fetch(CATEGORIES_API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(categoryData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при создании категории');
  }
  return data;
}

async function updateCategory(id, categoryData) {
  const response = await fetch(`${CATEGORIES_API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(categoryData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при обновлении категории');
  }
  return data;
}

async function deleteCategory(id) {
  const response = await fetch(`${CATEGORIES_API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при удалении категории');
  }
  return data;
}


// API: cart.js
const CART_API_URL = 'http://localhost:3001/api/cart';



async function getCart() {
  const response = await fetch(CART_API_URL, {
    headers: getHeaders()
  });
  if (!response.ok) {
    if (response.status === 401) {
      return { items: [], total_amount: 0, total_count: 0 };
    }
    throw new Error('Ошибка при загрузке корзины');
  }
  return await response.json();
}

async function addToCart(service_id, quantity = 1) {
  const response = await fetch(CART_API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ service_id, quantity })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка добавления в корзину');
  }
  return data;
}

async function updateCartItem(service_id, quantity) {
  const response = await fetch(`${CART_API_URL}/${service_id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ quantity })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка обновления количества');
  }
  return data;
}

async function removeCartItem(service_id) {
  const response = await fetch(`${CART_API_URL}/${service_id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка удаления из корзины');
  }
  return data;
}

async function clearCart() {
  const response = await fetch(CART_API_URL, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка очистки корзины');
  }
  return data;
}


// API: orders.js
const ORDERS_API_URL = 'http://localhost:3001/api/orders';



async function createOrder(orderData) {
  const response = await fetch(ORDERS_API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(orderData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при оформлении заказа');
  }
  return data;
}

async function getMyOrders() {
  const response = await fetch(`${ORDERS_API_URL}/my`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Ошибка при получении истории заказов');
  }
  return await response.json();
}


// API: reviews.js
const REVIEWS_API_URL = 'http://localhost:3001/api/reviews';



async function getServiceReviews(serviceId, params = {}) {
  const query = new URLSearchParams();
  if (params && params.search) query.append('search', params.search);
  if (params && params.rating && params.rating !== 'all') query.append('rating', params.rating);
  const qStr = query.toString();
  const url = `${REVIEWS_API_URL}/service/${serviceId}${qStr ? '?' + qStr : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Ошибка при загрузке отзывов');
  }
  return await response.json();
}

async function addReview(reviewData) {
  const response = await fetch(REVIEWS_API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reviewData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при отправке отзыва');
  }
  return data;
}


// API: admin.js
const ADMIN_API_URL = 'http://localhost:3001/api/admin';



async function getAdminStats() {
  const response = await fetch(`${ADMIN_API_URL}/stats`, { headers: getHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка получения статистики');
  return data;
}

async function getAdminOrders() {
  const response = await fetch(`${ADMIN_API_URL}/orders`, { headers: getHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка получения списка заказов');
  return data;
}

async function updateOrderStatus(orderId, status) {
  const response = await fetch(`${ADMIN_API_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка смены статуса заказа');
  return data;
}

async function deleteOrder(orderId) {
  const response = await fetch(`${ADMIN_API_URL}/orders/${orderId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка удаления заказа');
  return data;
}

async function getAdminUsers() {
  const response = await fetch(`${ADMIN_API_URL}/users`, { headers: getHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка получения списка пользователей');
  return data;
}

async function updateUserRole(userId, role) {
  const response = await fetch(`${ADMIN_API_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ role })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка изменения роли');
  return data;
}

async function deleteUser(userId) {
  const response = await fetch(`${ADMIN_API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка удаления пользователя');
  return data;
}

async function getAdminReviews(params = {}) {
  const query = new URLSearchParams();
  if (params && params.search) query.append('search', params.search);
  if (params && params.rating && params.rating !== 'all') query.append('rating', params.rating);
  const qStr = query.toString();
  const url = `${ADMIN_API_URL}/reviews${qStr ? '?' + qStr : ''}`;
  const response = await fetch(url, { headers: getHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка получения отзывов');
  return data;
}

async function deleteReview(reviewId) {
  const response = await fetch(`${ADMIN_API_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка удаления отзыва');
  return data;
}


// API: coupons.js
const COUPONS_API_URL = 'http://localhost:3001/api/coupons';



// Проверка и расчет скидки по промокоду
async function validateCoupon(code) {
  const response = await fetch(`${COUPONS_API_URL}/validate/${encodeURIComponent(code)}`, {
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка проверки промокода');
  }
  return data;
}

// Получение всех промокодов (для админа)
async function getCoupons() {
  const response = await fetch(COUPONS_API_URL, {
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось получить промокоды');
  }
  return data;
}

// Создание промокода (для админа)
async function createCoupon(data) {
  const response = await fetch(COUPONS_API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error || 'Не удалось создать промокод');
  }
  return resData;
}

// Удаление промокода (для админа)
async function deleteCoupon(id) {
  const response = await fetch(`${COUPONS_API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось удалить промокод');
  }
  return data;
}

// Переключение активности промокода (вкл/пауза)
async function toggleCoupon(id) {
  const response = await fetch(`${COUPONS_API_URL}/${id}/toggle`, {
    method: 'PUT',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось обновить промокод');
  }
  return data;
}


// Component: Navbar.jsx
// Компонент навигационной панели
function Navbar({
  user,
  cartCount,
  cartTotal,
  theme,
  onToggleTheme,
  onOpenAuth,
  onOpenProfile,
  onOpenAdmin,
  onOpenCart,
  onGoHome,
  onLogout
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "header-wrapper"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-logo",
    onClick: () => {
      if (onGoHome) onGoHome();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },
    style: {
      cursor: 'pointer'
    },
    title: "\u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E"
  }, /*#__PURE__*/React.createElement("h1", null, "\u0421\u0430\u043B\u043E\u043D-\u043C\u0430\u0433\u0430\u0437\u0438\u043D \xAB\u041B\u0430\u0432\u043A\u0430 \u0423\u0441\u043B\u0443\u0433\xBB")), /*#__PURE__*/React.createElement("div", {
    className: "header-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline btn-sm",
    onClick: onToggleTheme,
    title: "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0442\u0435\u043C\u0443 \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u044F"
  }, theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'), user ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`
  }, user.role === 'admin' ? 'Администратор' : 'Клиент'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      fontWeight: '500'
    }
  }, user.name), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline btn-sm",
    onClick: onOpenProfile,
    title: "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 \u043B\u0438\u0447\u043D\u044B\u0439 \u043A\u0430\u0431\u0438\u043D\u0435\u0442"
  }, "\u041B\u0438\u0447\u043D\u044B\u0439 \u043A\u0430\u0431\u0438\u043D\u0435\u0442"), user.role === 'admin' && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-warning btn-sm",
    onClick: onOpenAdmin,
    title: "\u041F\u0430\u043D\u0435\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430"
  }, "\u041F\u0430\u043D\u0435\u043B\u044C \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline btn-sm",
    onClick: onLogout,
    title: "\u0412\u044B\u0439\u0442\u0438 \u0438\u0437 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430",
    style: {
      color: 'var(--danger-color)'
    }
  }, "\u0412\u044B\u0439\u0442\u0438")) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary btn-sm",
    onClick: onOpenAuth
  }, "\u0412\u043E\u0439\u0442\u0438 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442"), user?.role !== 'admin' && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: onOpenCart,
    title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043A\u043E\u0440\u0437\u0438\u043D\u0443"
  }, /*#__PURE__*/React.createElement("span", null, "\u041A\u043E\u0440\u0437\u0438\u043D\u0430"), /*#__PURE__*/React.createElement("span", {
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '1px 7px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: 'bold',
      marginLeft: '4px'
    }
  }, cartCount), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'bold',
      marginLeft: '6px'
    }
  }, typeof formatPrice === 'function' ? formatPrice(cartTotal) : `${cartTotal} ₽`)))));
}

// Component: ServiceCard.jsx
// Карточка услуги в каталоге (все данные подтягиваются через JOIN)
function ServiceCard({
  service,
  onAddToCart,
  onOpenReviews,
  isAdmin = false
}) {
  if (!service) return null;
  const rating = Number(service.average_rating) || 0;
  const reviewsCount = service.reviews_count || 0;
  const duration = service.duration || service.duration_minutes || 60;
  const stock = service.stock !== undefined ? Number(service.stock) : 10;
  const originalPrice = Number(service.price || 0);
  const discountPercent = Number(service.discount_percent || 0);
  const finalPrice = discountPercent > 0 ? Number(service.final_price !== undefined ? service.final_price : calculateFinalPrice(originalPrice, discountPercent)) : originalPrice;
  return /*#__PURE__*/React.createElement("div", {
    className: "service-card"
  }, /*#__PURE__*/React.createElement("img", {
    src: service.image_url || '/images/services/styling.jpg',
    alt: service.name,
    className: "service-card-img",
    loading: "lazy",
    onError: e => {
      e.target.onerror = null;
      e.target.src = '/images/services/styling.jpg';
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "service-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "service-card-meta"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'rgba(2, 132, 199, 0.12)',
      color: 'var(--accent-color)',
      padding: '2px 8px',
      borderRadius: '4px',
      fontWeight: '600'
    }
  }, service.category_name || 'Без категории'), discountPercent > 0 && /*#__PURE__*/React.createElement("span", {
    className: "discount-badge"
  }, "-", discountPercent, "%")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: '13px',
      fontWeight: '500'
    }
  }, formatDuration(duration))), /*#__PURE__*/React.createElement("h3", {
    className: "service-card-title"
  }, service.name), /*#__PURE__*/React.createElement("p", {
    className: "service-card-desc"
  }, service.description), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline btn-sm",
    onClick: () => onOpenReviews(service),
    style: {
      fontSize: '12px',
      padding: '3px 8px'
    },
    title: "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043E\u0442\u0437\u044B\u0432\u044B"
  }, "\u2605 ", rating > 0 ? rating.toFixed(1) : 'нет оценок', " (", reviewsCount, ")"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12px',
      fontWeight: '600',
      color: stock > 0 ? stock <= 3 ? '#f59e0b' : 'var(--text-secondary)' : 'var(--danger-color)'
    }
  }, stock > 0 ? `Остаток: ${stock} шт.` : 'Нет в наличии')), /*#__PURE__*/React.createElement("div", {
    className: "service-card-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "service-price"
  }, discountPercent > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "old-price"
  }, formatPrice(originalPrice)), /*#__PURE__*/React.createElement("span", {
    className: "new-price"
  }, formatPrice(finalPrice))) : /*#__PURE__*/React.createElement("span", {
    className: "current-price"
  }, formatPrice(originalPrice))), !isAdmin && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary btn-sm",
    onClick: () => onAddToCart(service),
    disabled: stock <= 0,
    style: stock <= 0 ? {
      opacity: 0.5,
      cursor: 'not-allowed'
    } : {}
  }, stock > 0 ? 'В корзину' : 'Распродано'))));
}

// Component: Catalog.jsx
// Компонент каталога услуг с фильтрацией, поиском и обработкой ошибок API
function Catalog({
  services = [],
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  searchTerm = '',
  onSearchChange,
  sortOption = 'default',
  onSortChange,
  loading = false,
  error = null,
  onRetry,
  onAddToCart,
  onOpenReviews,
  isAdmin = false
}) {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyDiscount, setOnlyDiscount] = useState(false);

  // Защита от непредвиденных форматов ответа: всегда приводим к массиву
  const safeServices = Array.isArray(services) ? services : services && Array.isArray(services.services) ? services.services : [];
  const safeCategories = Array.isArray(categories) ? categories : categories && Array.isArray(categories.categories) ? categories.categories : [];

  // Локальная фильтрация по диапазону цен и скидкам
  const filteredServices = safeServices.filter(s => {
    if (!s) return false;
    if (onlyDiscount && (!s.discount_percent || Number(s.discount_percent) <= 0)) {
      return false;
    }
    const price = Number(s.final_price || s.price || 0);
    if (minPrice && price < Number(minPrice)) return false;
    if (maxPrice && price > Number(maxPrice)) return false;
    return true;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "catalog-layout"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "filters-sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "filters-header"
  }, /*#__PURE__*/React.createElement("h2", null, "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u0443\u0441\u043B\u0443\u0433"), selectedCategory !== 'all' && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm",
    onClick: () => onSelectCategory('all'),
    style: {
      color: 'var(--accent-color)',
      padding: 0
    }
  }, "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: `category-filter-item ${selectedCategory === 'all' ? 'active' : ''}`,
    onClick: () => onSelectCategory('all')
  }, /*#__PURE__*/React.createElement("span", null, "\u0412\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "count-badge"
  }, safeServices.length)), safeCategories.map(cat => /*#__PURE__*/React.createElement("div", {
    key: cat.id || cat.name,
    className: `category-filter-item ${selectedCategory === cat.name ? 'active' : ''}`,
    onClick: () => onSelectCategory(cat.name)
  }, /*#__PURE__*/React.createElement("span", null, cat.name), /*#__PURE__*/React.createElement("span", {
    className: "count-badge"
  }, cat.services_count || 0))), !safeCategories.some(c => c.name === 'Без категории') && /*#__PURE__*/React.createElement("div", {
    className: `category-filter-item ${selectedCategory === 'Без категории' ? 'active' : ''}`,
    onClick: () => onSelectCategory('Без категории')
  }, /*#__PURE__*/React.createElement("span", null, "\u0411\u0435\u0437 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "count-badge"
  }, safeServices.filter(s => !s.category_name || s.category_name === 'Без категории').length))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '20px',
      paddingTop: '16px',
      borderTop: '1px solid var(--border-color)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '14px',
      marginBottom: '10px'
    }
  }, "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0446\u0435\u043D\u0435 (\u20BD)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    placeholder: "\u041E\u0442",
    value: minPrice,
    onChange: e => setMinPrice(e.target.value),
    className: "form-control",
    style: {
      padding: '6px 8px',
      fontSize: '13px'
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    placeholder: "\u0414\u043E",
    value: maxPrice,
    onChange: e => setMaxPrice(e.target.value),
    className: "form-control",
    style: {
      padding: '6px 8px',
      fontSize: '13px'
    }
  })), (minPrice || maxPrice) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline btn-sm",
    onClick: () => {
      setMinPrice('');
      setMaxPrice('');
    },
    style: {
      marginTop: '8px',
      width: '100%'
    }
  }, "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0446\u0435\u043D\u0443"))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    className: "catalog-controls"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "search-input",
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u0443\u0441\u043B\u0443\u0433\u0438 \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E \u0438\u043B\u0438 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044E...",
    value: searchTerm,
    onChange: e => onSearchChange(e.target.value)
  }), /*#__PURE__*/React.createElement("select", {
    className: "select-input",
    value: sortOption,
    onChange: e => onSortChange(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "default"
  }, "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E"), /*#__PURE__*/React.createElement("option", {
    value: "price_asc"
  }, "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043D\u0435\u0434\u043E\u0440\u043E\u0433\u0438\u0435"), /*#__PURE__*/React.createElement("option", {
    value: "price_desc"
  }, "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0440\u0435\u043C\u0438\u0430\u043B\u044C\u043D\u044B\u0435"), /*#__PURE__*/React.createElement("option", {
    value: "rating"
  }, "\u041F\u043E \u0440\u0435\u0439\u0442\u0438\u043D\u0433\u0443 \u043E\u0442\u0437\u044B\u0432\u043E\u0432")), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      color: onlyDiscount ? '#ef4444' : 'var(--text-secondary)',
      background: onlyDiscount ? 'rgba(239, 68, 68, 0.12)' : 'var(--card-bg)',
      border: `1px solid ${onlyDiscount ? '#ef4444' : 'var(--border-color)'}`,
      padding: '8px 12px',
      borderRadius: '6px',
      whiteSpace: 'nowrap',
      userSelect: 'none'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: onlyDiscount,
    onChange: e => setOnlyDiscount(e.target.checked),
    style: {
      accentColor: '#ef4444',
      cursor: 'pointer'
    }
  }), /*#__PURE__*/React.createElement("span", null, "\u0422\u043E\u043B\u044C\u043A\u043E \u0441\u043E \u0441\u043A\u0438\u0434\u043A\u043E\u0439")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
      color: 'var(--text-secondary)'
    }
  }, "\u041D\u0430\u0439\u0434\u0435\u043D\u043E: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--text-primary)',
      marginLeft: '4px'
    }
  }, filteredServices.length))), error && /*#__PURE__*/React.createElement("div", {
    className: "server-error-banner"
  }, /*#__PURE__*/React.createElement("h3", null, "\u041E\u0448\u0438\u0431\u043A\u0430: \u0441\u0435\u0440\u0432\u0435\u0440 backend \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D"), /*#__PURE__*/React.createElement("p", null, "\u0412 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0435 \u043D\u0435\u0442 \u0442\u043E\u0432\u0430\u0440\u043E\u0432, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E \u0441\u0435\u0440\u0432\u0435\u0440 API \u043D\u0430 \u043F\u043E\u0440\u0442\u0443 3001 \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442."), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: onRetry
  }, "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430")), loading && !error && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("p", null, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0430 \u0443\u0441\u043B\u0443\u0433 \u0438\u0437 \u0431\u0430\u0437\u044B \u0434\u0430\u043D\u043D\u044B\u0445 PostgreSQL...")), !loading && !error && filteredServices.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "services-grid"
  }, filteredServices.map(service => /*#__PURE__*/React.createElement(ServiceCard, {
    key: service.id,
    service: service,
    onAddToCart: onAddToCart,
    onOpenReviews: onOpenReviews,
    isAdmin: isAdmin
  }))), !loading && !error && filteredServices.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '40px',
      textAlign: 'center',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '16px',
      marginBottom: '12px'
    }
  }, "\u0423\u0441\u043B\u0443\u0433 \u043F\u043E \u0437\u0430\u0434\u0430\u043D\u043D\u044B\u043C \u043A\u0440\u0438\u0442\u0435\u0440\u0438\u044F\u043C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E."), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: () => {
      onSelectCategory('all');
      onSearchChange('');
      setMinPrice('');
      setMaxPrice('');
    }
  }, "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B"))));
}

// Component: ReviewsModal.jsx
// Модальное окно просмотра и добавления отзывов об услуге
function ReviewsModal({
  service,
  user,
  isOpen,
  onClose,
  onOpenAuth,
  onReviewAdded
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Поиск и фильтрация по оценкам
  const [searchFilter, setSearchFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Форма отзыва
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  useEffect(() => {
    if (isOpen && service) {
      setSearchFilter('');
      setRatingFilter('all');
      loadReviews();
    }
  }, [isOpen, service]);
  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getServiceReviews(service.id);
      setReviews(data);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 3) {
      alert('Пожалуйста, напишите отзыв (не менее 3 символов)');
      return;
    }
    try {
      setSubmitting(true);
      await addReview({
        service_id: service.id,
        rating: Number(rating),
        comment: comment.trim()
      });
      setComment('');
      setSubmitSuccess('Спасибо! Ваш отзыв успешно опубликован.');
      await loadReviews();
      if (onReviewAdded) onReviewAdded();
      setTimeout(() => setSubmitSuccess(null), 3000);
    } catch (err) {
      alert(err.message || 'Ошибка отправки отзыва');
    } finally {
      setSubmitting(false);
    }
  };
  if (!isOpen || !service) return null;
  const filteredReviews = reviews.filter(rev => {
    if (ratingFilter !== 'all' && Number(rev.rating) !== Number(ratingFilter)) {
      return false;
    }
    if (searchFilter && searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      const matchAuthor = (rev.author_name || '').toLowerCase().includes(q);
      const matchComment = (rev.comment || '').toLowerCase().includes(q);
      if (!matchAuthor && !matchComment) return false;
    }
    return true;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "\u041E\u0442\u0437\u044B\u0432\u044B \u043E\u0431 \u0443\u0441\u043B\u0443\u0433\u0435"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '13px',
      color: 'var(--text-secondary)'
    }
  }, service.name, " (", service.category_name, ")")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, loading && /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      color: 'var(--text-secondary)'
    }
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043E\u0442\u0437\u044B\u0432\u043E\u0432..."), error && /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--danger-color)',
      textAlign: 'center'
    }
  }, error), !loading && reviews.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(0,0,0,0.02)',
      border: '1px solid var(--border-color)',
      padding: '10px 12px',
      borderRadius: '8px',
      marginBottom: '14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0442\u0435\u043A\u0441\u0442\u0443 \u043E\u0442\u0437\u044B\u0432\u0430 \u0438\u043B\u0438 \u0430\u0432\u0442\u043E\u0440\u0443...",
    value: searchFilter,
    onChange: e => setSearchFilter(e.target.value),
    style: {
      fontSize: '13px',
      padding: '6px 10px'
    }
  }), (searchFilter || ratingFilter !== 'all') && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline btn-sm",
    onClick: () => {
      setSearchFilter('');
      setRatingFilter('all');
    },
    style: {
      fontSize: '12px',
      whiteSpace: 'nowrap'
    }
  }, "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12px',
      color: 'var(--text-secondary)'
    }
  }, "\u041E\u0446\u0435\u043D\u043A\u0430:"), ['all', '5', '4', '3', '2', '1'].map(rate => {
    const count = rate === 'all' ? reviews.length : reviews.filter(r => Number(r.rating) === Number(rate)).length;
    if (rate !== 'all' && count === 0) return null;
    return /*#__PURE__*/React.createElement("button", {
      key: rate,
      type: "button",
      className: `btn btn-sm ${ratingFilter === rate ? 'btn-primary' : 'btn-outline'}`,
      onClick: () => setRatingFilter(rate),
      style: {
        fontSize: '11px',
        padding: '2px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '3px'
      }
    }, /*#__PURE__*/React.createElement("span", null, rate === 'all' ? 'Все' : `${rate} ★`), /*#__PURE__*/React.createElement("span", {
      style: {
        opacity: 0.75
      }
    }, "(", count, ")"));
  }))), !loading && reviews.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      color: 'var(--text-secondary)',
      padding: '20px 0'
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0442\u0437\u044B\u0432\u043E\u0432 \u043D\u0430 \u044D\u0442\u0443 \u0443\u0441\u043B\u0443\u0433\u0443."), !loading && reviews.length > 0 && filteredReviews.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      color: 'var(--text-secondary)',
      padding: '16px 0',
      fontSize: '13px'
    }
  }, "\u041E\u0442\u0437\u044B\u0432\u043E\u0432 \u0441 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u043C\u0438 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u043C\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E."), !loading && filteredReviews.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '280px',
      overflowY: 'auto',
      marginBottom: '20px'
    }
  }, filteredReviews.map(rev => /*#__PURE__*/React.createElement("div", {
    key: rev.id,
    style: {
      padding: '12px',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '4px'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: '14px'
    }
  }, rev.author_name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      fontWeight: 'bold',
      color: 'var(--accent-color)'
    }
  }, "\u041E\u0446\u0435\u043D\u043A\u0430: ", rev.rating, " \u0438\u0437 5")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '13px',
      color: 'var(--text-primary)',
      lineHeight: '1.4'
    }
  }, rev.comment), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      marginTop: '4px'
    }
  }, new Date(rev.created_at).toLocaleDateString('ru-RU'))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-color)',
      paddingTop: '16px'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: '15px',
      marginBottom: '10px'
    }
  }, "\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043E\u0442\u0437\u044B\u0432"), user ? /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, submitSuccess && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px',
      background: 'var(--success-bg)',
      color: 'var(--success-color)',
      borderRadius: '6px',
      fontSize: '13px',
      marginBottom: '10px'
    }
  }, submitSuccess), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041E\u0446\u0435\u043D\u043A\u0430 \u0443\u0441\u043B\u0443\u0433\u0438:"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: rating,
    onChange: e => setRating(e.target.value),
    style: {
      maxWidth: '200px'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: 5
  }, "5 (\u041E\u0442\u043B\u0438\u0447\u043D\u043E)"), /*#__PURE__*/React.createElement("option", {
    value: 4
  }, "4 (\u0425\u043E\u0440\u043E\u0448\u043E)"), /*#__PURE__*/React.createElement("option", {
    value: 3
  }, "3 (\u041D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u043E)"), /*#__PURE__*/React.createElement("option", {
    value: 2
  }, "2 (\u041D\u0435 \u043F\u043E\u043D\u0440\u0430\u0432\u0438\u043B\u043E\u0441\u044C)"), /*#__PURE__*/React.createElement("option", {
    value: 1
  }, "1 (\u041F\u043B\u043E\u0445\u043E)"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u0412\u0430\u0448 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439:"), /*#__PURE__*/React.createElement("textarea", {
    className: "form-control",
    rows: "3",
    placeholder: "\u0412\u0430\u0448 \u043E\u0442\u0437\u044B\u0432...",
    value: comment,
    onChange: e => setComment(e.target.value),
    style: {
      resize: 'none'
    },
    required: true
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary btn-sm",
    disabled: submitting
  }, submitting ? 'Отправка...' : 'Опубликовать отзыв')) : /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(0,0,0,0.03)',
      padding: '14px',
      borderRadius: '8px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '13px',
      color: 'var(--text-secondary)',
      marginBottom: '10px'
    }
  }, "\u041E\u0441\u0442\u0430\u0432\u043B\u044F\u0442\u044C \u043E\u0442\u0437\u044B\u0432\u044B \u043C\u043E\u0433\u0443\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438."), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary btn-sm",
    onClick: () => {
      onClose();
      onOpenAuth();
    }
  }, "\u0412\u043E\u0439\u0442\u0438 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442")))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: onClose
  }, "\u0417\u0430\u043A\u0440\u044B\u0442\u044C"))));
}

// Component: CartModal.jsx
// Модальное окно корзины с управлением количеством, удалением и переходом к оформлению
function CartModal({
  isOpen,
  onClose,
  cartItems,
  cartTotal,
  cartCount,
  user,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
  onOpenAuth
}) {
  if (!isOpen) return null;

  // Расчет суммарной длительности сеанса мастера (максимум 360 минут = 6 часов)
  const totalDuration = cartItems.reduce((sum, item) => sum + (Number(item.duration) || 60) * item.quantity, 0);
  const maxSessionMinutes = 360;
  const durationHours = Math.floor(totalDuration / 60);
  const durationMins = totalDuration % 60;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content modal-lg",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "\u0412\u0430\u0448\u0430 \u043A\u043E\u0440\u0437\u0438\u043D\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '4px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      color: 'var(--text-secondary)'
    }
  }, cartCount > 0 ? `Выбрано позиций: ${cartCount}` : 'Корзина пуста'), cartItems.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12px',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '10px',
      background: totalDuration >= 300 ? '#fef3c7' : 'rgba(0,0,0,0.06)',
      color: totalDuration >= 300 ? '#b45309' : 'var(--text-secondary)',
      border: totalDuration >= 300 ? '1px solid #fde68a' : 'none'
    }
  }, "\u23F1 \u0412\u0440\u0435\u043C\u044F \u0441\u0435\u0430\u043D\u0441\u0430 \u043C\u0430\u0441\u0442\u0435\u0440\u0430: ", durationHours > 0 ? `${durationHours} ч ` : '', durationMins, " \u043C\u0438\u043D / \u043C\u0430\u043A\u0441. 6 \u0447"))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, !user && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--warning-bg)',
      color: 'var(--text-primary)',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '13px'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0414\u043B\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u043A\u043E\u0440\u0437\u0438\u043D\u044B \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 \u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary btn-sm",
    onClick: () => {
      onClose();
      onOpenAuth();
    }
  }, "\u0412\u043E\u0439\u0442\u0438")), cartItems.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 0',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("h4", null, "\u0412 \u0432\u0430\u0448\u0435\u0439 \u043A\u043E\u0440\u0437\u0438\u043D\u0435 \u043F\u043E\u043A\u0430 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435\u0442"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '14px',
      marginTop: '6px'
    }
  }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0436\u0435\u043B\u0430\u0435\u043C\u044B\u0435 \u0443\u0441\u043B\u0443\u0433\u0438 \u0432 \u043D\u0430\u0448\u0435\u043C \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0435"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    style: {
      marginTop: '16px'
    },
    onClick: onClose
  }, "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 \u043A\u0430\u0442\u0430\u043B\u043E\u0433")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '350px',
      overflowY: 'auto'
    }
  }, cartItems.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.service_id,
    className: "cart-item-row"
  }, /*#__PURE__*/React.createElement("img", {
    src: item.image_url || '/images/services/styling.jpg',
    alt: item.service_name,
    style: {
      width: '56px',
      height: '56px',
      borderRadius: '6px',
      objectFit: 'cover'
    },
    onError: e => {
      e.target.onerror = null;
      e.target.src = '/images/services/styling.jpg';
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "cart-item-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cart-item-title"
  }, item.service_name), /*#__PURE__*/React.createElement("div", {
    className: "cart-item-category"
  }, item.category_name, " \u2022 \u23F1 ", formatDuration(item.duration), " \u2022 \u0412 \u043D\u0430\u043B\u0438\u0447\u0438\u0438: ", item.stock !== undefined ? item.stock : 10, " \u0448\u0442."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '13px',
      marginTop: '3px'
    }
  }, item.discount_percent > 0 ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      textDecoration: 'line-through',
      color: 'var(--text-secondary)',
      marginRight: '6px'
    }
  }, formatPrice(item.price)), /*#__PURE__*/React.createElement("strong", {
    style: {
      color: '#ef4444'
    }
  }, formatPrice(item.final_price !== undefined ? item.final_price : calculateFinalPrice(item.price, item.discount_percent)), " / \u0448\u0442."), /*#__PURE__*/React.createElement("span", {
    className: "badge-discount",
    style: {
      marginLeft: '6px',
      fontSize: '11px'
    }
  }, "-", item.discount_percent, "%")) : /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--accent-color)'
    }
  }, formatPrice(item.price), " / \u0448\u0442."))), /*#__PURE__*/React.createElement("div", {
    className: "cart-qty-controls"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "cart-qty-btn",
    onClick: () => onUpdateQty(item.service_id, item.quantity - 1),
    title: "\u0423\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E"
  }, "-"), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: '24px',
      textAlign: 'center',
      fontWeight: 'bold'
    }
  }, item.quantity), (() => {
    const itemDur = Number(item.duration) || 60;
    const itemStock = item.stock !== undefined ? Number(item.stock) : 10;
    const isStockLimit = item.quantity >= itemStock;
    const isQtyLimit = item.quantity >= 3;
    const isTimeLimit = totalDuration + itemDur > maxSessionMinutes;
    const isPlusDisabled = isStockLimit || isQtyLimit || isTimeLimit;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cart-qty-btn",
      onClick: () => onUpdateQty(item.service_id, item.quantity + 1),
      disabled: isPlusDisabled,
      title: isStockLimit ? `Достигнут максимальный остаток на складе (${itemStock} шт.)` : isQtyLimit ? "Один мастер не может выполнить более 3 одинаковых процедур за один визит" : isTimeLimit ? "Превышен лимит времени мастера на один визит (максимум 6 часов)" : "Увеличить количество",
      style: {
        opacity: isPlusDisabled ? 0.35 : 1,
        cursor: isPlusDisabled ? 'not-allowed' : 'pointer'
      }
    }, "+");
  })()), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: '90px',
      textAlign: 'right',
      fontWeight: 'bold'
    }
  }, formatPrice(item.item_total)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm",
    style: {
      color: 'var(--danger-color)',
      padding: '4px 8px'
    },
    onClick: () => onRemoveItem(item.service_id),
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0443\u0441\u043B\u0443\u0433\u0443 \u0438\u0437 \u043A\u043E\u0440\u0437\u0438\u043D\u044B"
  }, "\u2715")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '20px',
      paddingTop: '16px',
      borderTop: '2px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline btn-sm",
    style: {
      color: 'var(--danger-color)'
    },
    onClick: onClearCart
  }, "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u043E\u0440\u0437\u0438\u043D\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
      marginRight: '10px'
    }
  }, "\u0418\u0442\u043E\u0433\u043E \u043A \u043E\u043F\u043B\u0430\u0442\u0435:"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '22px',
      fontWeight: 'bold',
      color: 'var(--accent-color)'
    }
  }, formatPrice(cartTotal)))))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: onClose
  }, "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0432\u044B\u0431\u043E\u0440"), cartItems.length > 0 && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: () => {
      if (!user) {
        alert('Для оформления заказа необходимо войти в аккаунт');
        onClose();
        onOpenAuth();
        return;
      }
      onClose();
      onOpenCheckout();
    }
  }, "\u041E\u0444\u043E\u0440\u043C\u0438\u0442\u044C \u0437\u0430\u043A\u0430\u0437 \u2192"))));
}

// Component: CheckoutModal.jsx
// Модальное окно оформления заказа с валидацией адреса, даты доставки и промокодами
function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  cartTotal,
  user,
  onOrderSuccess
}) {
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Промокод
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState(null);

  // Минимальная дата доставки — сегодня
  const todayStr = new Date().toISOString().split('T')[0];
  useEffect(() => {
    if (user && user.default_address) {
      setDeliveryAddress(user.default_address);
    }
    // По умолчанию ставим завтрашний день
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMsg(null);
  }, [user, isOpen]);
  const handleApplyCoupon = async e => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) {
      setCouponMsg({
        type: 'error',
        text: 'Введите промокод'
      });
      return;
    }
    try {
      setCouponLoading(true);
      setCouponMsg(null);
      const res = await validateCoupon(couponInput.trim());
      setAppliedCoupon(res);
      setCouponMsg({
        type: 'success',
        text: `Промокод "${res.code}" применен! Скидка: -${res.discount_percent}%`
      });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMsg({
        type: 'error',
        text: err.message || 'Промокод не найден'
      });
    } finally {
      setCouponLoading(false);
    }
  };
  const discountAmount = appliedCoupon ? Math.round(cartTotal * (appliedCoupon.discount_percent / 100)) : 0;
  const finalTotal = Math.max(0, cartTotal - discountAmount);
  const handleSubmit = async e => {
    e.preventDefault();
    setErrorMsg(null);

    // Валидация адреса доставки
    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      setErrorMsg('Пожалуйста, укажите полный адрес доставки (улица, дом, квартира)');
      return;
    }

    // Валидация даты доставки (Requirement 2.3: не может быть меньше текущей даты)
    if (!deliveryDate) {
      setErrorMsg('Пожалуйста, выберите дату доставки');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(deliveryDate);
    chosen.setHours(0, 0, 0, 0);
    if (chosen < today) {
      setErrorMsg('Дата доставки не может быть меньше текущей даты (валидация)');
      return;
    }
    try {
      setLoading(true);
      const res = await createOrder({
        delivery_address: deliveryAddress.trim(),
        delivery_date: deliveryDate,
        coupon_code: appliedCoupon ? appliedCoupon.code : null
      });
      alert(res.message);
      if (onOrderSuccess) onOrderSuccess(res.order);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка оформления заказа');
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h3", null, "\u041E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u043A\u0430\u0437\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, errorMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--danger-bg)',
      color: 'var(--danger-color)',
      padding: '10px 14px',
      borderRadius: '6px',
      fontSize: '13px',
      marginBottom: '16px',
      fontWeight: '500'
    }
  }, errorMsg), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(0,0,0,0.03)',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '14px'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043F\u043E\u0437\u0438\u0446\u0438\u0439:"), /*#__PURE__*/React.createElement("strong", null, cartItems.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '14px'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0421\u0443\u043C\u043C\u0430 \u0431\u0435\u0437 \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434\u0430:"), /*#__PURE__*/React.createElement("span", null, cartTotal.toLocaleString('ru-RU'), " \u20BD")), appliedCoupon && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '14px',
      color: '#16a34a'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u041F\u0440\u043E\u043C\u043E\u043A\u043E\u0434 (", appliedCoupon.code, " -", appliedCoupon.discount_percent, "%):"), /*#__PURE__*/React.createElement("strong", null, "-", discountAmount.toLocaleString('ru-RU'), " \u20BD")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '16px',
      borderTop: '1px solid var(--border-color)',
      paddingTop: '6px',
      marginTop: '4px'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0418\u0442\u043E\u0433\u043E \u043A \u043E\u043F\u043B\u0430\u0442\u0435:"), /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--accent-color)'
    }
  }, finalTotal.toLocaleString('ru-RU'), " \u20BD"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("label", null, "\u041F\u0440\u043E\u043C\u043E\u043A\u043E\u0434 \u043D\u0430 \u0441\u043A\u0438\u0434\u043A\u0443:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "LAVKA10, BEAUTY15, STUDENT20",
    value: couponInput,
    onChange: e => setCouponInput(e.target.value.toUpperCase()),
    style: {
      textTransform: 'uppercase',
      letterSpacing: '1px',
      fontWeight: 'bold'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: handleApplyCoupon,
    disabled: couponLoading || !couponInput.trim(),
    style: {
      whiteSpace: 'nowrap'
    }
  }, couponLoading ? '...' : 'Применить')), couponMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      marginTop: '4px',
      color: couponMsg.type === 'success' ? '#16a34a' : 'var(--danger-color)',
      fontWeight: '500'
    }
  }, couponMsg.text), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      display: 'block',
      marginTop: '3px'
    }
  }, "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434\u044B: ", /*#__PURE__*/React.createElement("strong", null, "LAVKA10"), " (-10%), ", /*#__PURE__*/React.createElement("strong", null, "BEAUTY15"), " (-15%), ", /*#__PURE__*/React.createElement("strong", null, "STUDENT20"), " (-20%)")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u0410\u0434\u0440\u0435\u0441 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438 / \u0432\u044B\u0435\u0437\u0434\u0430 \u043C\u0430\u0441\u0442\u0435\u0440\u0430:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "\u0433. \u041C\u043E\u0441\u043A\u0432\u0430, \u0443\u043B. \u041B\u0435\u043D\u0438\u043D\u0430, \u0434. 10, \u043A\u0432. 25",
    value: deliveryAddress,
    onChange: e => setDeliveryAddress(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }
  }, "\u0411\u0443\u0434\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D \u0432 \u043F\u0440\u043E\u0444\u0438\u043B\u0435 \u043A\u0430\u043A \u0430\u0434\u0440\u0435\u0441 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E.")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u0414\u0430\u0442\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438 / \u043E\u043A\u0430\u0437\u0430\u043D\u0438\u044F \u0443\u0441\u043B\u0443\u0433\u0438:"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: "form-control",
    min: todayStr,
    value: deliveryDate,
    onChange: e => setDeliveryDate(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }
  }, "* \u0414\u0430\u0442\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043C\u0435\u043D\u044C\u0448\u0435 \u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0435\u0433\u043E \u0434\u043D\u044F.")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044C:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: `${user ? user.name : ''} (${user ? user.phone || user.email : ''})`,
    disabled: true,
    style: {
      opacity: 0.8
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: onClose,
    disabled: loading
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: loading
  }, loading ? 'Сохранение заказа на сервере...' : `Подтвердить заказ (${finalTotal.toLocaleString('ru-RU')} ₽)`)))));
}

// Component: AuthModal.jsx
// Модальное окно авторизации и регистрации
function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  onOpenForgotPassword
}) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Поля авторизации
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Поля регистрации
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  if (!isOpen) return null;

  // Обработка авторизации
  const handleLoginSubmit = async e => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Пожалуйста, заполните поля Email и Пароль');
      return;
    }
    try {
      setLoading(true);
      const res = await loginUser(loginEmail, loginPassword);
      localStorage.setItem('token', res.token);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  // Обработка регистрации
  const handleRegisterSubmit = async e => {
    e.preventDefault();
    setErrorMsg(null);
    if (!regName || regName.trim().length < 2) {
      setErrorMsg('Введите полное имя (минимум 2 символа)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail || !emailRegex.test(regEmail.trim())) {
      setErrorMsg('Введите корректный адрес электронной почты');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Пароль должен содержать минимум 6 символов');
      return;
    }
    const phoneDigits = regPhone.replace(/\D/g, '');
    if (!regPhone || phoneDigits.length !== 11) {
      setErrorMsg('Укажите полный номер телефона (ровно 11 цифр: +7 (XXX) XXX-XX-XX)');
      return;
    }
    try {
      setLoading(true);
      const res = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim()
      });
      localStorage.setItem('token', res.token);
      onAuthSuccess(res.user);
      alert('Регистрация успешно завершена! Добро пожаловать, ' + res.user.name);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs-nav",
    style: {
      margin: 0,
      border: 'none'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'login' ? 'active' : ''}`,
    onClick: () => {
      setActiveTab('login');
      setErrorMsg(null);
    }
  }, "\u0412\u0445\u043E\u0434"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'register' ? 'active' : ''}`,
    onClick: () => {
      setActiveTab('register');
      setErrorMsg(null);
    }
  }, "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, errorMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--danger-bg)',
      color: 'var(--danger-color)',
      padding: '10px 14px',
      borderRadius: '6px',
      fontSize: '13px',
      marginBottom: '16px',
      fontWeight: '500'
    }
  }, errorMsg), activeTab === 'login' ? /*#__PURE__*/React.createElement("form", {
    onSubmit: handleLoginSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430 (Email):"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    className: "form-control",
    placeholder: "admin@lavka.ru",
    value: loginEmail,
    onChange: e => setLoginEmail(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041F\u0430\u0440\u043E\u043B\u044C:"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    className: "form-control",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: loginPassword,
    onChange: e => setLoginPassword(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--accent-color)',
      fontSize: '13px',
      cursor: 'pointer'
    },
    onClick: () => {
      onClose();
      onOpenForgotPassword();
    }
  }, "\u0417\u0430\u0431\u044B\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C?")), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    style: {
      width: '100%',
      padding: '10px'
    },
    disabled: loading
  }, loading ? 'Проверка данных...' : 'Войти')) : /*#__PURE__*/React.createElement("form", {
    onSubmit: handleRegisterSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041F\u043E\u043B\u043D\u043E\u0435 \u0438\u043C\u044F (\u0424\u0418\u041E):"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "\u0418\u0432\u0430\u043D \u0418\u0432\u0430\u043D\u043E\u0432",
    value: regName,
    onChange: e => setRegName(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430 (Email):"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    className: "form-control",
    placeholder: "user@example.com",
    value: regEmail,
    onChange: e => setRegEmail(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041F\u0430\u0440\u043E\u043B\u044C (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432):"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    className: "form-control",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: regPassword,
    onChange: e => setRegPassword(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430:"), /*#__PURE__*/React.createElement("input", {
    type: "tel",
    className: "form-control",
    placeholder: "+7 (999) 000-00-00",
    maxLength: 18,
    value: regPhone,
    onChange: e => setRegPhone(formatPhoneNumber(e.target.value)),
    required: true
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }
  }, "\u0420\u043E\u0432\u043D\u043E 11 \u0446\u0438\u0444\u0440: +7 (XXX) XXX-XX-XX")), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    style: {
      width: '100%',
      padding: '10px'
    },
    disabled: loading
  }, loading ? 'Создание аккаунта...' : 'Зарегистрироваться')))));
}

// Component: ForgotPasswordModal.jsx
// Модальное окно восстановления пароля через Email с 6-значным проверочным кодом
function ForgotPasswordModal({
  isOpen,
  onClose,
  onOpenAuth
}) {
  const [step, setStep] = useState(1); // 1: ввод email, 2: ввод кода из письма и нового пароля, 3: успех
  const [email, setEmail] = useState('ambagga21@gmail.com');
  const [code, setCode] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Сброс формы к начальному состоянию (Шаг 1)
  const resetForm = () => {
    setStep(1);
    setCode('');
    setPreviewUrl(null);
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Сброс состояния при каждом открытии модального окна
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);
  if (!isOpen) return null;
  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  // Шаг 1: Запрос кода восстановления на Email
  const handleStep1Submit = async e => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Введите корректный адрес электронной почты');
      return;
    }
    try {
      setLoading(true);
      const res = await sendPasswordResetCode(cleanEmail);
      if (res && res.preview_url) {
        setPreviewUrl(res.preview_url);
      }
      setCode('');
      setStep(2);

      // Запрос разрешения на браузерные уведомления на рабочем столе
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка отправки кода на email');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: Проверка кода и установка нового пароля
  const handleStep2Submit = async e => {
    e.preventDefault();
    setErrorMsg(null);
    if (!code || code.trim().length < 4) {
      setErrorMsg('Введите проверочный код из письма');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Новый пароль должен содержать минимум 6 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Пароли не совпадают');
      return;
    }
    try {
      setLoading(true);
      const res = await resetPasswordWithEmailCode(email.trim().toLowerCase(), code.trim(), newPassword);
      setSuccessMsg(res.message);
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: handleModalClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h3", null, "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0443"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: handleModalClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, errorMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--danger-bg)',
      color: 'var(--danger-color)',
      padding: '10px 14px',
      borderRadius: '6px',
      fontSize: '13px',
      marginBottom: '16px',
      fontWeight: '500'
    }
  }, "\u26A0\uFE0F ", errorMsg), step === 1 && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleStep1Submit
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
      marginBottom: '16px',
      lineHeight: '1.5'
    }
  }, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0430\u0434\u0440\u0435\u0441 \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0439 \u043F\u043E\u0447\u0442\u044B, \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u044B\u0439 \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438. \u041C\u044B \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043C \u043D\u0430 \u043D\u0435\u0433\u043E \u043F\u0438\u0441\u044C\u043C\u043E \u0441 \u043F\u0440\u043E\u0432\u0435\u0440\u043E\u0447\u043D\u044B\u043C \u043A\u043E\u0434\u043E\u043C \u0434\u043B\u044F \u0441\u043C\u0435\u043D\u044B \u043F\u0430\u0440\u043E\u043B\u044F."), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430 (Email):"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    className: "form-control",
    placeholder: "ambagga21@gmail.com",
    value: email,
    onChange: e => setEmail(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    style: {
      width: '100%',
      marginTop: '10px'
    },
    disabled: loading
  }, loading ? 'Отправка письма...' : '✉️ Отправить проверочный код')), step === 2 && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleStep2Submit
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(2, 132, 199, 0.1)',
      border: '1px solid rgba(2, 132, 199, 0.3)',
      padding: '12px 14px',
      borderRadius: '8px',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '13px',
      color: 'var(--text-primary)',
      fontWeight: '500'
    }
  }, "\u2709\uFE0F \u041F\u0438\u0441\u044C\u043C\u043E \u0441 \u043A\u043E\u0434\u043E\u043C \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u043D\u0430: ", /*#__PURE__*/React.createElement("strong", null, email)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--text-secondary)',
      marginTop: '4px'
    }
  }, "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0432\u0445\u043E\u0434\u044F\u0449\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F (\u0438 \u043F\u0430\u043F\u043A\u0443 \xAB\u0421\u043F\u0430\u043C\xBB). \u041A\u043E\u0434 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u0435\u043D 15 \u043C\u0438\u043D\u0443\u0442."), previewUrl && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px dashed rgba(2, 132, 199, 0.3)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: previewUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      fontSize: '12px',
      color: 'var(--accent-color)',
      textDecoration: 'underline',
      fontWeight: '500'
    }
  }, "\uD83D\uDCEC \u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432\u0445\u043E\u0434\u044F\u0449\u0435\u0435 \u043F\u0438\u0441\u044C\u043C\u043E \u0432 \u043E\u043D\u043B\u0430\u0439\u043D-\u043F\u043E\u0447\u0442\u0435 \u2197"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041F\u0440\u043E\u0432\u0435\u0440\u043E\u0447\u043D\u044B\u0439 \u043A\u043E\u0434 \u0438\u0437 \u043F\u0438\u0441\u044C\u043C\u0430 (6 \u0446\u0438\u0444\u0440):"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "recovery_code",
    maxLength: 6,
    inputMode: "numeric",
    autoComplete: "off",
    className: "form-control",
    placeholder: "000000",
    value: code,
    onChange: e => setCode(e.target.value.replace(/\D/g, '')),
    style: {
      letterSpacing: '4px',
      fontWeight: 'bold',
      fontSize: '18px',
      textAlign: 'center'
    },
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432):"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    className: "form-control",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: newPassword,
    onChange: e => setNewPassword(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C:"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    className: "form-control",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: confirmPassword,
    onChange: e => setConfirmPassword(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      marginTop: '14px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: () => setStep(1),
    disabled: loading
  }, "\u2190 \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C Email"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    style: {
      flex: 1
    },
    disabled: loading
  }, loading ? 'Проверка кода...' : 'Установить новый пароль'))), step === 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '20px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '40px',
      marginBottom: '10px'
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("h4", {
    style: {
      color: 'var(--success-color)',
      marginBottom: '10px'
    }
  }, "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D!"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
      marginBottom: '20px'
    }
  }, successMsg || 'Теперь вы можете войти в систему с вашим новым паролем.'), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: () => {
      handleModalClose();
      onOpenAuth();
    }
  }, "\u0412\u043E\u0439\u0442\u0438 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442")))));
}

// Component: ProfileModal.jsx
// Модальное окно личного кабинета (заказы, профиль, сброс/смена пароля)
function ProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'info' | 'security'
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Редактирование профиля
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState(null);

  // Смена пароля
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.default_address || '');
      loadOrders();
    }
  }, [isOpen, user]);
  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const data = await getMyOrders();
      setOrders(data);
    } catch (err) {
      setOrdersError(err.message || 'Ошибка загрузки истории заказов');
    } finally {
      setOrdersLoading(false);
    }
  };
  const handleInfoSubmit = async e => {
    e.preventDefault();
    setInfoMsg(null);
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setInfoMsg({
        type: 'error',
        text: 'Имя должно содержать не менее 2 символов'
      });
      return;
    }
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/;
    if (!nameRegex.test(trimmedName)) {
      setInfoMsg({
        type: 'error',
        text: 'Имя может содержать только буквы, дефисы и пробелы'
      });
      return;
    }
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setInfoMsg({
        type: 'error',
        text: 'Введите корректный адрес электронной почты (Email)'
      });
      return;
    }
    const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
    if (phone && phoneDigits.length !== 11) {
      setInfoMsg({
        type: 'error',
        text: 'Номер телефона должен содержать ровно 11 цифр (например, +7 (911) 811-21-22)'
      });
      return;
    }
    const trimmedAddress = address.trim();
    if (trimmedAddress && trimmedAddress.length < 5) {
      setInfoMsg({
        type: 'error',
        text: 'Адрес должен содержать не менее 5 символов'
      });
      return;
    }
    try {
      setInfoSaving(true);
      const res = await updateProfile({
        name: trimmedName,
        email: trimmedEmail,
        phone: phone.trim(),
        default_address: trimmedAddress
      });
      localStorage.setItem('token', res.token);
      onProfileUpdated(res.user);
      setInfoMsg({
        type: 'success',
        text: res.message
      });
    } catch (err) {
      setInfoMsg({
        type: 'error',
        text: err.message || 'Ошибка обновления данных'
      });
    } finally {
      setInfoSaving(false);
    }
  };
  const handlePasswordSubmit = async e => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword.length < 6) {
      setPwdMsg({
        type: 'error',
        text: 'Новый пароль должен содержать не менее 6 символов'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({
        type: 'error',
        text: 'Новые пароли не совпадают'
      });
      return;
    }
    try {
      setPwdSaving(true);
      const res = await changePassword(oldPassword, newPassword);
      setPwdMsg({
        type: 'success',
        text: res.message
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdMsg({
        type: 'error',
        text: err.message || 'Ошибка смены пароля'
      });
    } finally {
      setPwdSaving(false);
    }
  };
  if (!isOpen || !user) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content modal-lg",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "\u041B\u0438\u0447\u043D\u044B\u0439 \u043A\u0430\u0431\u0438\u043D\u0435\u0442"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      color: 'var(--text-secondary)'
    }
  }, user.name, " (", user.role === 'admin' ? 'Администратор' : 'Клиент', ")")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs-nav"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'orders' ? 'active' : ''}`,
    onClick: () => setActiveTab('orders')
  }, "\u041C\u043E\u0438 \u0437\u0430\u043A\u0430\u0437\u044B (", orders.length, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'info' ? 'active' : ''}`,
    onClick: () => setActiveTab('info')
  }, "\u041B\u0438\u0447\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'security' ? 'active' : ''}`,
    onClick: () => setActiveTab('security')
  }, "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C \u0438 \u043F\u0430\u0440\u043E\u043B\u044C")), activeTab === 'orders' && /*#__PURE__*/React.createElement("div", null, ordersLoading && /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      padding: '20px'
    }
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0437\u0430\u043A\u0430\u0437\u043E\u0432..."), ordersError && /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--danger-color)',
      textAlign: 'center'
    }
  }, ordersError), !ordersLoading && orders.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '30px 0',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("p", null, "\u0412\u044B \u043F\u043E\u043A\u0430 \u043D\u0435 \u043E\u0444\u043E\u0440\u043C\u0438\u043B\u0438 \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u0437\u0430\u043A\u0430\u0437\u0430.")), !ordersLoading && orders.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '380px',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "custom-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u2116"), /*#__PURE__*/React.createElement("th", null, "\u0414\u0430\u0442\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438"), /*#__PURE__*/React.createElement("th", null, "\u0410\u0434\u0440\u0435\u0441 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438"), /*#__PURE__*/React.createElement("th", null, "\u0421\u043E\u0441\u0442\u0430\u0432 \u0443\u0441\u043B\u0443\u0433"), /*#__PURE__*/React.createElement("th", null, "\u0421\u0443\u043C\u043C\u0430"), /*#__PURE__*/React.createElement("th", null, "\u0421\u0442\u0430\u0442\u0443\u0441"))), /*#__PURE__*/React.createElement("tbody", null, orders.map((o, index) => /*#__PURE__*/React.createElement("tr", {
    key: o.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, "\u2116 ", index + 1)), /*#__PURE__*/React.createElement("td", null, new Date(o.delivery_date).toLocaleDateString('ru-RU')), /*#__PURE__*/React.createElement("td", null, o.delivery_address), /*#__PURE__*/React.createElement("td", {
    style: {
      maxWidth: '240px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '13px',
      fontWeight: '500'
    }
  }, o.items_summary), o.coupon_code && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-block',
      marginTop: '4px',
      padding: '2px 6px',
      borderRadius: '4px',
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#16a34a',
      fontSize: '11px',
      fontWeight: '600'
    }
  }, "\uD83C\uDF9F \u041A\u0443\u043F\u043E\u043D: ", o.coupon_code, " (-", Number(o.discount_amount).toLocaleString('ru-RU'), " \u20BD)")), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 'bold',
      color: 'var(--accent-color)'
    }
  }, Number(o.total_price).toLocaleString('ru-RU'), " \u20BD"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge",
    style: {
      background: o.status === 'Выполнен' ? '#10b981' : o.status === 'Отменен' ? '#ef4444' : '#0284c7',
      color: '#ffffff'
    }
  }, o.status)))))))), activeTab === 'info' && /*#__PURE__*/React.createElement("form", {
    onSubmit: handleInfoSubmit,
    style: {
      maxWidth: '480px',
      margin: '0 auto'
    }
  }, infoMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      borderRadius: '6px',
      marginBottom: '12px',
      fontSize: '13px',
      background: infoMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
      color: infoMsg.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'
    }
  }, infoMsg.text), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041F\u043E\u043B\u043D\u043E\u0435 \u0438\u043C\u044F (\u0424\u0418\u041E):"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: name,
    onChange: e => setName(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430 (Email):"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    className: "form-control",
    value: email,
    onChange: e => setEmail(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D:"), /*#__PURE__*/React.createElement("input", {
    type: "tel",
    className: "form-control",
    placeholder: "+7 (999) 000-00-00",
    maxLength: 18,
    value: phone,
    onChange: e => setPhone(formatPhoneNumber(e.target.value))
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }
  }, "\u0420\u043E\u0432\u043D\u043E 11 \u0446\u0438\u0444\u0440: +7 (XXX) XXX-XX-XX")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u0410\u0434\u0440\u0435\u0441 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: address,
    onChange: e => setAddress(e.target.value),
    placeholder: "\u0433. \u041C\u043E\u0441\u043A\u0432\u0430, \u0443\u043B. \u041B\u0435\u043D\u0438\u043D\u0430, \u0434. 10"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    style: {
      width: '100%',
      marginTop: '10px'
    },
    disabled: infoSaving
  }, infoSaving ? 'Сохранение...' : 'Сохранить изменения')), activeTab === 'security' && /*#__PURE__*/React.createElement("form", {
    onSubmit: handlePasswordSubmit,
    style: {
      maxWidth: '480px',
      margin: '0 auto'
    }
  }, pwdMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      borderRadius: '6px',
      marginBottom: '12px',
      fontSize: '13px',
      background: pwdMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
      color: pwdMsg.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'
    }
  }, pwdMsg.text), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C:"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    className: "form-control",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: oldPassword,
    onChange: e => setOldPassword(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432):"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    className: "form-control",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: newPassword,
    onChange: e => setNewPassword(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C:"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    className: "form-control",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: confirmPassword,
    onChange: e => setConfirmPassword(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    style: {
      width: '100%',
      marginTop: '10px'
    },
    disabled: pwdSaving
  }, pwdSaving ? 'Обновление...' : 'Обновить пароль'))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: onClose
  }, "\u0417\u0430\u043A\u0440\u044B\u0442\u044C"))));
}

// Component: AdminPanel.jsx
// Полнофункциональная панель администратора для управления всеми ресурсами ИС
function AdminPanel({
  isOpen,
  onClose,
  services,
  categories,
  onServicesChanged,
  onCategoriesChanged,
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'services' | 'categories' | 'coupons' | 'reviews' | 'users'
  const [stats, setStats] = useState(null);

  // Списки данных
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [panelError, setPanelError] = useState(null);
  const [panelSuccess, setPanelSuccess] = useState(null);
  const [serviceModalError, setServiceModalError] = useState(null);

  // Поиск по каждой вкладке админ-панели
  const [orderSearch, setOrderSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [couponSearch, setCouponSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Форма добавления нового промокода
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponFirstOnly, setNewCouponFirstOnly] = useState(false);

  // Модалка добавления/редактирования услуги (длительность в часах и минутах + скидка + склад)
  const [editingService, setEditingService] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [sName, setSName] = useState('');
  const [sCat, setSCat] = useState('');
  const [sPrice, setSPrice] = useState('');
  const [sStock, setSStock] = useState(10);
  const [sHours, setSHours] = useState(1);
  const [sMinutes, setSMinutes] = useState(0);
  const [sDiscount, setSDiscount] = useState(0);
  const [sDesc, setSDesc] = useState('');
  const [sImg, setSImg] = useState('');
  const [sNewCatName, setSNewCatName] = useState('');

  // Редактирование существующей категории
  const [editingCat, setEditingCat] = useState(null);
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [catModalError, setCatModalError] = useState(null);

  // Поиск и фильтрация отзывов в панели админа
  const [revSearch, setRevSearch] = useState('');
  const [revRating, setRevRating] = useState('all');

  // Форма добавления новой категории
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Загружаем статистику и все списки параллельно при открытии панели,
  // чтобы счётчики во всех вкладках сразу показывали реальные числа
  const loadAllData = async () => {
    setLoading(true);
    setPanelError(null);
    try {
      await Promise.all([loadStats(), loadOrders(), loadUsers(), loadReviews(), loadCoupons()]);
    } catch (e) {
      console.warn('Ошибка загрузки данных админ-панели:', e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);
  const loadStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (e) {
      console.warn('Stats error:', e.message);
    }
  };
  const loadOrders = async () => {
    try {
      const data = await getAdminOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Orders load error:', e);
      setPanelError(e.message || 'Ошибка получения списка заказов');
    }
  };
  const loadUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Users load error:', e);
      setPanelError(e.message || 'Ошибка получения списка пользователей');
    }
  };
  const loadReviews = async () => {
    try {
      const data = await getAdminReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Reviews load error:', e);
      setPanelError(e.message || 'Ошибка получения отзывов');
    }
  };
  const loadCoupons = async () => {
    try {
      const data = await getCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Coupons load error:', e);
    }
  };

  // Создание промокода
  const handleCreateCoupon = async e => {
    e.preventDefault();
    if (!newCouponCode.trim()) {
      setPanelError('Укажите код промокода');
      return;
    }
    const disc = parseInt(newCouponDiscount, 10);
    if (isNaN(disc) || disc <= 0 || disc > 99) {
      setPanelError('Скидка по промокоду должна быть целым числом в диапазоне от 1 до 99%');
      return;
    }
    try {
      setPanelError(null);
      await createCoupon({
        code: newCouponCode.trim().toUpperCase(),
        discount_percent: disc,
        description: newCouponDesc.trim(),
        first_order_only: newCouponFirstOnly
      });
      setNewCouponCode('');
      setNewCouponDiscount(10);
      setNewCouponDesc('');
      setNewCouponFirstOnly(false);
      await loadCoupons();
      setPanelSuccess('Промокод успешно создан и готов к применению');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка создания промокода');
    }
  };

  // Удаление промокода
  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Вы уверены, что хотите удалить промокод "${code}"?`)) return;
    try {
      setPanelError(null);
      await deleteCoupon(id);
      await loadCoupons();
      setPanelSuccess(`Промокод "${code}" успешно удален`);
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления промокода');
    }
  };

  // Переключение статуса промокода (вкл/пауза)
  const handleToggleCoupon = async id => {
    try {
      setPanelError(null);
      await toggleCoupon(id);
      await loadCoupons();
      setPanelSuccess('Статус активности промокода успешно обновлен');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка изменения статуса промокода');
    }
  };

  // Смена статуса заказа (с запретом изменения завершенных заказов)
  const handleStatusChange = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder && (targetOrder.status === 'Выполнен' || targetOrder.status === 'Отменен')) {
      setPanelError(`Заказ №${orderId} уже имеет статус "${targetOrder.status}". Изменять выполненные или отмененные заказы запрещено.`);
      return;
    }
    try {
      setPanelError(null);
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
      await loadStats();
      setPanelSuccess(`Статус заказа №${orderId} изменен на "${newStatus}"`);
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка смены статуса заказа');
    }
  };

  // Удаление заказа
  const handleDeleteOrder = async orderId => {
    if (!window.confirm('Вы действительно хотите удалить этот заказ?')) return;
    try {
      setPanelError(null);
      await deleteOrder(orderId);
      await loadOrders();
      await loadStats();
      setPanelSuccess('Заказ успешно удален');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления заказа');
    }
  };

  // Смена роли пользователя
  const handleRoleChange = async (userId, newRole) => {
    try {
      setPanelError(null);
      await updateUserRole(userId, newRole);
      await loadUsers();
      setPanelSuccess('Роль пользователя успешно обновлена');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка изменения роли');
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async userId => {
    if (!window.confirm('Удалить пользователя из системы?')) return;
    try {
      setPanelError(null);
      await deleteUser(userId);
      await loadUsers();
      await loadStats();
      setPanelSuccess('Пользователь успешно удален');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления пользователя');
    }
  };

  // Удаление отзыва
  const handleDeleteReview = async reviewId => {
    if (!window.confirm('Удалить отзыв?')) return;
    try {
      setPanelError(null);
      await deleteReview(reviewId);
      await loadReviews();
      if (onServicesChanged) onServicesChanged();
      setPanelSuccess('Отзыв успешно удален');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления отзыва');
    }
  };

  // Открытие формы добавления новой услуги
  const handleOpenAddService = () => {
    setEditingService(null);
    setSName('');
    const firstCat = categories.find(c => c.name !== 'Без категории');
    setSCat(firstCat ? firstCat.name : categories.length > 0 ? categories[0].name : 'Без категории');
    setSNewCatName('');
    setSPrice('');
    setSStock(10);
    setSHours(1);
    setSMinutes(0);
    setSDiscount(0);
    setSDesc('');
    setSImg('/images/services/styling.jpg');
    setServiceModalError(null);
    setIsServiceModalOpen(true);
  };

  // Открытие формы редактирования услуги
  const handleOpenEditService = s => {
    setEditingService(s);
    setSName(s.name);
    setSCat(s.category_name || 'Без категории');
    setSNewCatName('');
    setSPrice(s.price);
    setSStock(s.stock !== undefined ? s.stock : 10);
    const totalMins = Number(s.duration || s.duration_minutes || 60);
    setSHours(Math.floor(totalMins / 60));
    setSMinutes(totalMins % 60);
    setSDiscount(Number(s.discount_percent || 0));
    setSDesc(s.description || '');
    setSImg(s.image_url || '/images/services/styling.jpg');
    setServiceModalError(null);
    setIsServiceModalOpen(true);
  };

  // Сохранение услуги
  const handleSaveService = async e => {
    e.preventDefault();
    if (!sName || !sPrice) {
      setServiceModalError('Заполните обязательные поля (название и цена)');
      return;
    }
    if (Number(sPrice) <= 0) {
      setServiceModalError('Цена услуги должна быть строго больше 0 ₽');
      return;
    }
    const calculatedDuration = (parseInt(sHours, 10) || 0) * 60 + (parseInt(sMinutes, 10) || 0);
    if (calculatedDuration <= 0) {
      setServiceModalError('Длительность услуги должна быть больше 0 минут');
      return;
    }
    if (calculatedDuration > 360) {
      setServiceModalError('Длительность услуги не может превышать 6 часов (360 минут) — максимальная рабочая смена мастера');
      return;
    }

    // Валидация скидки от 0 до 99
    const discountVal = sDiscount === '' ? 0 : Number(sDiscount);
    if (isNaN(discountVal) || !Number.isInteger(discountVal)) {
      setServiceModalError('Скидка должна быть целым числом в диапазоне от 0 до 99%');
      return;
    }
    if (discountVal < 0) {
      setServiceModalError('Ошибка: скидка не может быть меньше 0%');
      return;
    }
    if (discountVal >= 100) {
      setServiceModalError('Ошибка: скидка не может быть 100% или больше (максимум 99%)');
      return;
    }

    // Валидация остатка на складе
    const stockVal = sStock === '' ? 10 : parseInt(sStock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      setServiceModalError('Количество на складе должно быть целым неотрицательным числом');
      return;
    }
    let finalCategoryName = sCat;
    if (sCat === '__new__') {
      if (!sNewCatName || !sNewCatName.trim()) {
        setServiceModalError('Введите название новой категории');
        return;
      }
      finalCategoryName = sNewCatName.trim();
    }
    try {
      setServiceModalError(null);
      const payload = {
        name: sName.trim(),
        category_name: finalCategoryName,
        price: Number(sPrice),
        stock: stockVal,
        duration: calculatedDuration,
        discount_percent: discountVal,
        description: sDesc.trim(),
        image_url: sImg.trim() || '/images/services/styling.jpg'
      };
      if (editingService) {
        await updateService(editingService.id, payload);
        setPanelSuccess('Услуга успешно обновлена');
      } else {
        await createService(payload);
        setPanelSuccess('Новая услуга успешно создана');
      }
      setIsServiceModalOpen(false);
      if (onServicesChanged) onServicesChanged();
      if (onCategoriesChanged) onCategoriesChanged();
      await loadStats();
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (err) {
      setServiceModalError(err.message || 'Ошибка сохранения услуги');
    }
  };

  // Удаление услуги
  const handleDeleteService = async id => {
    if (!window.confirm('Вы действительно хотите удалить эту услугу?')) return;
    try {
      setPanelError(null);
      await deleteService(id);
      if (onServicesChanged) onServicesChanged();
      await loadStats();
      setPanelSuccess('Услуга успешно удалена');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления услуги');
    }
  };

  // Редактирование существующей категории
  const handleOpenEditCategory = cat => {
    if (cat.name === 'Без категории') {
      setPanelError('Системную категорию «Без категории» нельзя редактировать или переименовывать');
      return;
    }
    setEditingCat(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setCatModalError(null);
    setIsEditCatModalOpen(true);
  };
  const handleSaveEditCategory = async e => {
    e.preventDefault();
    if (!editCatName.trim()) {
      setCatModalError('Название категории обязательно');
      return;
    }
    try {
      setCatModalError(null);
      await updateCategory(editingCat.id, {
        name: editCatName.trim(),
        description: editCatDesc.trim()
      });
      setIsEditCatModalOpen(false);
      setEditingCat(null);
      if (onCategoriesChanged) onCategoriesChanged();
      if (onServicesChanged) onServicesChanged();
      setPanelSuccess('Категория успешно обновлена');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setCatModalError(e.message || 'Ошибка обновления категории');
    }
  };

  // Добавление новой категории
  const handleAddCategory = async e => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      setPanelError(null);
      await createCategory({
        name: catName.trim(),
        description: catDesc.trim()
      });
      setCatName('');
      setCatDesc('');
      if (onCategoriesChanged) onCategoriesChanged();
      setPanelSuccess('Категория успешно добавлена');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка добавления категории');
    }
  };

  // Удаление категории
  const handleDeleteCategory = async (id, catName) => {
    if (catName === 'Без категории') {
      setPanelError('Системную категорию «Без категории» нельзя удалить, она должна присутствовать всегда');
      return;
    }
    if (!window.confirm('Удалить категорию? Услуги из этой категории будут сохранены и автоматически перенесены в категорию «Без категории».')) return;
    try {
      setPanelError(null);
      await deleteCategory(id);
      if (onCategoriesChanged) onCategoriesChanged();
      if (onServicesChanged) onServicesChanged();
      setPanelSuccess('Категория удалена. Все товары автоматически перенесены в раздел «Без категории»');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления категории');
    }
  };
  if (!isOpen) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content modal-lg",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: '980px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "\u041F\u0430\u043D\u0435\u043B\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430"), stats && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      color: 'var(--text-secondary)'
    }
  }, "\u0417\u0430\u043A\u0430\u0437\u043E\u0432: ", /*#__PURE__*/React.createElement("strong", null, stats.total_orders), " | \u0412\u044B\u0440\u0443\u0447\u043A\u0430: ", /*#__PURE__*/React.createElement("strong", null, Number(stats.total_revenue).toLocaleString('ru-RU'), " \u20BD"), " | \u041A\u043B\u0438\u0435\u043D\u0442\u043E\u0432: ", /*#__PURE__*/React.createElement("strong", null, stats.total_users))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: onClose,
    title: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043D\u0435\u043B\u044C"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs-nav"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'orders' ? 'active' : ''}`,
    onClick: () => setActiveTab('orders')
  }, "\u0417\u0430\u043A\u0430\u0437\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432 (", orders.length, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'services' ? 'active' : ''}`,
    onClick: () => setActiveTab('services')
  }, "\u0423\u0441\u043B\u0443\u0433\u0438 (", services.length, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'categories' ? 'active' : ''}`,
    onClick: () => setActiveTab('categories')
  }, "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 (", categories.length, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'coupons' ? 'active' : ''}`,
    onClick: () => setActiveTab('coupons')
  }, "\u041F\u0440\u043E\u043C\u043E\u043A\u043E\u0434\u044B (", coupons.length, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'reviews' ? 'active' : ''}`,
    onClick: () => setActiveTab('reviews')
  }, "\u041E\u0442\u0437\u044B\u0432\u044B (", reviews.length, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tab-btn ${activeTab === 'users' ? 'active' : ''}`,
    onClick: () => setActiveTab('users')
  }, "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438 (", users.length, ")")), panelError && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid var(--danger-color)',
      color: 'var(--danger-color)',
      padding: '10px 14px',
      borderRadius: '8px',
      margin: '12px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '13px'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u26A0\uFE0F ", panelError), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setPanelError(null),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--danger-color)',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      marginLeft: '12px'
    }
  }, "\u2715")), panelSuccess && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(34, 197, 94, 0.15)',
      border: '1px solid #22c55e',
      color: '#22c55e',
      padding: '10px 14px',
      borderRadius: '8px',
      margin: '12px 0',
      fontSize: '13px'
    }
  }, "\u2713 ", panelSuccess), activeTab === 'orders' && (() => {
    const filteredOrders = orders.filter(o => {
      if (!orderSearch.trim()) return true;
      const q = orderSearch.trim().toLowerCase();
      return String(o.id).includes(q) || (o.user_name || '').toLowerCase().includes(q) || (o.user_email || '').toLowerCase().includes(q) || (o.user_phone || '').toLowerCase().includes(q) || (o.delivery_address || '').toLowerCase().includes(q) || (o.status || '').toLowerCase().includes(q) || (o.coupon_code || '').toLowerCase().includes(q) || (o.items_summary || '').toLowerCase().includes(q);
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        fontSize: '15px'
      }
    }, "\u0421\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u0441\u0442\u0443\u043F\u0438\u0432\u0448\u0438\u0445 \u0437\u0430\u043A\u0430\u0437\u043E\u0432 (", orders.length, ")"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-outline btn-sm",
      onClick: loadOrders
    }, "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: '12px'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041F\u043E\u0438\u0441\u043A \u0437\u0430\u043A\u0430\u0437\u043E\u0432 \u043F\u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0443, email, \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0443, \u0430\u0434\u0440\u0435\u0441\u0443, \u0441\u0442\u0430\u0442\u0443\u0441\u0443 \u0438\u043B\u0438 \u043A\u0443\u043F\u043E\u043D\u0443...",
      value: orderSearch,
      onChange: e => setOrderSearch(e.target.value),
      style: {
        fontSize: '13px',
        padding: '6px 10px'
      }
    })), loading ? /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: 'center',
        padding: '20px'
      }
    }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0437\u0430\u043A\u0430\u0437\u043E\u0432...") : filteredOrders.length === 0 ? /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: 'center',
        padding: '20px',
        color: 'var(--text-secondary)'
      }
    }, orderSearch ? 'Ничего не найдено по запросу поиска' : 'Заказов пока нет') : /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: '420px',
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("table", {
      className: "custom-table"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u2116"), /*#__PURE__*/React.createElement("th", null, "\u041A\u043B\u0438\u0435\u043D\u0442"), /*#__PURE__*/React.createElement("th", null, "\u0422\u0435\u043B\u0435\u0444\u043E\u043D"), /*#__PURE__*/React.createElement("th", null, "\u0410\u0434\u0440\u0435\u0441 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438"), /*#__PURE__*/React.createElement("th", null, "\u0414\u0430\u0442\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438"), /*#__PURE__*/React.createElement("th", null, "\u0423\u0441\u043B\u0443\u0433\u0438 (\u0441 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E\u043C x2, x3)"), /*#__PURE__*/React.createElement("th", null, "\u0421\u0443\u043C\u043C\u0430"), /*#__PURE__*/React.createElement("th", null, "\u0421\u0442\u0430\u0442\u0443\u0441"))), /*#__PURE__*/React.createElement("tbody", null, filteredOrders.map((o, idx) => /*#__PURE__*/React.createElement("tr", {
      key: o.id
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, "\u2116 ", idx + 1)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, o.user_name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }
    }, o.user_email)), /*#__PURE__*/React.createElement("td", null, formatPhoneNumber(o.user_phone) || o.user_phone || '—'), /*#__PURE__*/React.createElement("td", null, o.delivery_address), /*#__PURE__*/React.createElement("td", null, new Date(o.delivery_date).toLocaleDateString('ru-RU')), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '13px',
        color: 'var(--accent-color)',
        fontWeight: '500'
      }
    }, o.items_summary), o.coupon_code && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-block',
        marginTop: '4px',
        padding: '2px 6px',
        borderRadius: '4px',
        background: 'rgba(34, 197, 94, 0.15)',
        color: '#16a34a',
        fontSize: '11px',
        fontWeight: '600'
      }
    }, "\uD83C\uDF9F \u041A\u0443\u043F\u043E\u043D: ", o.coupon_code, " (-", Number(o.discount_amount).toLocaleString('ru-RU'), " \u20BD)")), /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: 'bold'
      }
    }, Number(o.total_price).toLocaleString('ru-RU'), " \u20BD"), /*#__PURE__*/React.createElement("td", null, o.status === 'Выполнен' ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '4px',
        background: 'rgba(34, 197, 94, 0.15)',
        color: '#22c55e',
        fontWeight: '600',
        fontSize: '12px'
      },
      title: "\u0417\u0430\u043A\u0430\u0437 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D (\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043E)"
    }, "\u2713 \u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D") : o.status === 'Отменен' ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '4px',
        background: 'rgba(239, 68, 68, 0.15)',
        color: 'var(--danger-color)',
        fontWeight: '600',
        fontSize: '12px'
      },
      title: "\u0417\u0430\u043A\u0430\u0437 \u043E\u0442\u043C\u0435\u043D\u0435\u043D (\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043E)"
    }, "\u2715 \u041E\u0442\u043C\u0435\u043D\u0435\u043D") : /*#__PURE__*/React.createElement("select", {
      value: o.status,
      onChange: e => handleStatusChange(o.id, e.target.value),
      style: {
        padding: '4px 6px',
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
        background: 'var(--card-bg)',
        color: 'var(--text-primary)',
        fontSize: '12px'
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: "\u041F\u0440\u0438\u043D\u044F\u0442"
    }, "\u041F\u0440\u0438\u043D\u044F\u0442"), /*#__PURE__*/React.createElement("option", {
      value: "\u0412 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435"
    }, "\u0412 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435"), /*#__PURE__*/React.createElement("option", {
      value: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D"
    }, "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D"), /*#__PURE__*/React.createElement("option", {
      value: "\u041E\u0442\u043C\u0435\u043D\u0435\u043D"
    }, "\u041E\u0442\u043C\u0435\u043D\u0435\u043D")))))))));
  })(), activeTab === 'services' && (() => {
    const filteredServices = services.filter(s => {
      if (!serviceSearch.trim()) return true;
      const q = serviceSearch.trim().toLowerCase();
      return (s.name || '').toLowerCase().includes(q) || (s.category_name || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px'
      }
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        fontSize: '15px'
      }
    }, "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u043E\u043C \u0443\u0441\u043B\u0443\u0433 (", services.length, ")"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-primary btn-sm",
      onClick: handleOpenAddService
    }, "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0443\u0441\u043B\u0443\u0433\u0443")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: '12px'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041F\u043E\u0438\u0441\u043A \u0443\u0441\u043B\u0443\u0433 \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E, \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u0438\u043B\u0438 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044E...",
      value: serviceSearch,
      onChange: e => setServiceSearch(e.target.value),
      style: {
        fontSize: '13px',
        padding: '6px 10px'
      }
    })), filteredServices.length === 0 ? /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: 'center',
        padding: '20px',
        color: 'var(--text-secondary)'
      }
    }, serviceSearch ? 'Услуг по запросу поиска не найдено' : 'Каталог услуг пуст') : /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: '420px',
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("table", {
      className: "custom-table"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u2116"), /*#__PURE__*/React.createElement("th", null, "\u0424\u043E\u0442\u043E"), /*#__PURE__*/React.createElement("th", null, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0438"), /*#__PURE__*/React.createElement("th", null, "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F"), /*#__PURE__*/React.createElement("th", null, "\u0421\u043A\u043B\u0430\u0434"), /*#__PURE__*/React.createElement("th", null, "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("th", null, "\u0426\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("th", null, "\u0421\u043A\u0438\u0434\u043A\u0430"), /*#__PURE__*/React.createElement("th", null, "\u0420\u0435\u0439\u0442\u0438\u043D\u0433"), /*#__PURE__*/React.createElement("th", null, "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F"))), /*#__PURE__*/React.createElement("tbody", null, filteredServices.map((s, idx) => {
      const discount = Number(s.discount_percent || 0);
      const origPrice = Number(s.price || 0);
      const finalPrice = discount > 0 ? Number(s.final_price !== undefined ? s.final_price : calculateFinalPrice(origPrice, discount)) : origPrice;
      return /*#__PURE__*/React.createElement("tr", {
        key: s.id
      }, /*#__PURE__*/React.createElement("td", null, "\u2116 ", idx + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("img", {
        src: s.image_url || '/images/services/styling.jpg',
        alt: "",
        style: {
          width: '40px',
          height: '40px',
          borderRadius: '4px',
          objectFit: 'cover'
        }
      })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, s.name)), /*#__PURE__*/React.createElement("td", null, s.category_name || 'Без категории'), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: '600',
          color: (s.stock !== undefined ? s.stock : 10) > 0 ? 'var(--text-primary)' : 'var(--danger-color)'
        }
      }, s.stock !== undefined ? `${s.stock} шт.` : '10 шт.')), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: '500'
        }
      }, formatDuration(s.duration))), /*#__PURE__*/React.createElement("td", null, discount > 0 ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
        style: {
          textDecoration: 'line-through',
          color: 'var(--text-secondary)',
          fontSize: '11px',
          display: 'block'
        }
      }, formatPrice(origPrice)), /*#__PURE__*/React.createElement("strong", {
        style: {
          color: '#ef4444'
        }
      }, formatPrice(finalPrice))) : /*#__PURE__*/React.createElement("strong", {
        style: {
          fontWeight: 'bold'
        }
      }, formatPrice(origPrice))), /*#__PURE__*/React.createElement("td", null, discount > 0 ? /*#__PURE__*/React.createElement("span", {
        className: "badge-discount"
      }, "-", discount, "%") : /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-secondary)',
          fontSize: '12px'
        }
      }, "\u2014")), /*#__PURE__*/React.createElement("td", null, Number(s.average_rating) > 0 ? Number(s.average_rating).toFixed(1) : '—'), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: '6px'
        }
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "btn btn-outline btn-sm",
        onClick: () => handleOpenEditService(s)
      }, "\u0420\u0435\u0434."), /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "btn btn-sm",
        style: {
          color: 'var(--danger-color)'
        },
        onClick: () => handleDeleteService(s.id)
      }, "\u0423\u0434\u0430\u043B."))));
    })))));
  })(), activeTab === 'categories' && (() => {
    const filteredCategories = categories.filter(c => {
      if (!catSearch.trim()) return true;
      const q = catSearch.trim().toLowerCase();
      return (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: '14px'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041F\u043E\u0438\u0441\u043A \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0439 \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E \u0438\u043B\u0438 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044E...",
      value: catSearch,
      onChange: e => setCatSearch(e.target.value),
      style: {
        fontSize: '13px',
        padding: '6px 10px'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '20px'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
      style: {
        fontSize: '15px',
        marginBottom: '12px'
      }
    }, "\u0421\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 (", categories.length, ")"), /*#__PURE__*/React.createElement("table", {
      className: "custom-table"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438"), /*#__PURE__*/React.createElement("th", null, "\u0423\u0441\u043B\u0443\u0433"), /*#__PURE__*/React.createElement("th", null, "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F"))), /*#__PURE__*/React.createElement("tbody", null, filteredCategories.map(c => /*#__PURE__*/React.createElement("tr", {
      key: c.id || c.name
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, c.name), c.description && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }
    }, c.description)), /*#__PURE__*/React.createElement("td", null, c.services_count || 0), /*#__PURE__*/React.createElement("td", null, c.name === 'Без категории' ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        fontStyle: 'italic'
      }
    }, "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0430\u044F") : /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '6px'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-outline btn-sm",
      onClick: () => handleOpenEditCategory(c),
      title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E"
    }, "\u270F\uFE0F"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-sm",
      style: {
        color: 'var(--danger-color)'
      },
      onClick: () => handleDeleteCategory(c.id, c.name),
      title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E (\u0442\u043E\u0432\u0430\u0440\u044B \u043F\u0435\u0440\u0435\u0439\u0434\u0443\u0442 \u0432 \xAB\u0411\u0435\u0437 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438\xBB)"
    }, "\u2715")))))))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'rgba(0,0,0,0.02)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        height: 'fit-content'
      }
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        fontSize: '15px',
        marginBottom: '12px'
      }
    }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E"), /*#__PURE__*/React.createElement("form", {
      onSubmit: handleAddCategory
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("label", null, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438:"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0421\u043F\u0430-\u043F\u0440\u043E\u0446\u0435\u0434\u0443\u0440\u044B",
      value: catName,
      onChange: e => setCatName(e.target.value),
      required: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("label", null, "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E):"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438...",
      value: catDesc,
      onChange: e => setCatDesc(e.target.value)
    })), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      className: "btn btn-primary btn-sm",
      style: {
        width: '100%'
      }
    }, "+ \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E")))));
  })(), activeTab === 'coupons' && (() => {
    const filteredCoupons = coupons.filter(c => {
      if (!couponSearch.trim()) return true;
      const q = couponSearch.trim().toLowerCase();
      return (c.code || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q) || String(c.discount_percent).includes(q);
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: '14px'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041F\u043E\u0438\u0441\u043A \u043A\u0443\u043F\u043E\u043D\u043E\u0432 \u043F\u043E \u043A\u043E\u0434\u0443, \u0440\u0430\u0437\u043C\u0435\u0440\u0443 \u0441\u043A\u0438\u0434\u043A\u0438 \u0438\u043B\u0438 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044E...",
      value: couponSearch,
      onChange: e => setCouponSearch(e.target.value),
      style: {
        fontSize: '13px',
        padding: '6px 10px'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '20px'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        fontSize: '15px'
      }
    }, "\u0421\u043F\u0438\u0441\u043E\u043A \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434\u043E\u0432 (", coupons.length, ")"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-outline btn-sm",
      onClick: loadCoupons
    }, "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C")), filteredCoupons.length === 0 ? /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: 'center',
        padding: '20px',
        color: 'var(--text-secondary)'
      }
    }, couponSearch ? 'Промокодов по запросу не найдено' : 'Промокоды отсутствуют') : /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: '420px',
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("table", {
      className: "custom-table"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u041A\u043E\u0434"), /*#__PURE__*/React.createElement("th", null, "\u0421\u043A\u0438\u0434\u043A\u0430"), /*#__PURE__*/React.createElement("th", null, "\u0421\u0442\u0430\u0442\u0443\u0441"), /*#__PURE__*/React.createElement("th", null, "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F"))), /*#__PURE__*/React.createElement("tbody", null, filteredCoupons.map(cp => /*#__PURE__*/React.createElement("tr", {
      key: cp.id
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--accent-color)'
      }
    }, cp.code), cp.first_order_only && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: '2px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-block',
        fontSize: '10px',
        background: '#fef3c7',
        color: '#b45309',
        padding: '1px 5px',
        borderRadius: '4px',
        fontWeight: 'bold'
      }
    }, "\u2B50 \u0422\u043E\u043B\u044C\u043A\u043E \u043D\u0430 1-\u0439 \u0437\u0430\u043A\u0430\u0437")), cp.description && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        marginTop: '2px'
      }
    }, cp.description)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "badge-discount",
      style: {
        fontWeight: 'bold'
      }
    }, "-", cp.discount_percent, "%")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-block',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        background: cp.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        color: cp.is_active ? '#22c55e' : 'var(--danger-color)'
      }
    }, cp.is_active ? 'Активен' : 'Отключен')), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '6px'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-outline btn-sm",
      onClick: () => handleToggleCoupon(cp.id),
      title: cp.is_active ? 'Отключить промокод' : 'Активировать промокод'
    }, cp.is_active ? 'Пауза' : 'Вкл'), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-sm",
      style: {
        color: 'var(--danger-color)'
      },
      onClick: () => handleDeleteCoupon(cp.id, cp.code),
      title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434"
    }, "\u2715"))))))))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'rgba(0,0,0,0.02)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        height: 'fit-content'
      }
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        fontSize: '15px',
        marginBottom: '12px'
      }
    }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434"), /*#__PURE__*/React.createElement("form", {
      onSubmit: handleCreateCoupon
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("label", null, "\u041A\u043E\u0434 \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434\u0430:"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: SUMMER25",
      value: newCouponCode,
      onChange: e => setNewCouponCode(e.target.value.toUpperCase()),
      required: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("label", null, "\u0420\u0430\u0437\u043C\u0435\u0440 \u0441\u043A\u0438\u0434\u043A\u0438 (% \u043E\u0442 1 \u0434\u043E 99):"), /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: "1",
      max: "99",
      className: "form-control",
      placeholder: "15",
      value: newCouponDiscount,
      onChange: e => setNewCouponDiscount(e.target.value),
      required: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("label", null, "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E):"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0421\u043A\u0438\u0434\u043A\u0430 15% \u0434\u043B\u044F \u043D\u043E\u0432\u044B\u0445 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432",
      value: newCouponDesc,
      onChange: e => setNewCouponDesc(e.target.value)
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group",
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '10px 0'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      id: "firstOrderOnlyCheck",
      checked: newCouponFirstOnly,
      onChange: e => setNewCouponFirstOnly(e.target.checked),
      style: {
        cursor: 'pointer',
        width: '16px',
        height: '16px'
      }
    }), /*#__PURE__*/React.createElement("label", {
      htmlFor: "firstOrderOnlyCheck",
      style: {
        margin: 0,
        fontSize: '13px',
        cursor: 'pointer'
      }
    }, "\u0422\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u043F\u0435\u0440\u0432\u044B\u0439 \u0437\u0430\u043A\u0430\u0437 \u043D\u043E\u0432\u043E\u0433\u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0430")), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      className: "btn btn-primary btn-sm",
      style: {
        width: '100%',
        marginTop: '6px'
      }
    }, "+ \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u043C\u043E\u043A\u043E\u0434")))));
  })(), activeTab === 'reviews' && (() => {
    const filteredReviews = reviews.filter(r => {
      if (revRating !== 'all' && Number(r.rating) !== Number(revRating)) {
        return false;
      }
      if (revSearch && revSearch.trim()) {
        const q = revSearch.trim().toLowerCase();
        const matchService = (r.service_name || '').toLowerCase().includes(q);
        const matchAuthor = (r.author_name || '').toLowerCase().includes(q);
        const matchComment = (r.comment || '').toLowerCase().includes(q);
        if (!matchService && !matchAuthor && !matchComment) return false;
      }
      return true;
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        fontSize: '15px'
      }
    }, "\u041C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u044F \u043E\u0442\u0437\u044B\u0432\u043E\u0432 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432 (", reviews.length, ")"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-outline btn-sm",
      onClick: loadReviews
    }, "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '14px',
        background: 'rgba(0,0,0,0.02)',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: '220px'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0443\u0441\u043B\u0443\u0433\u0435, \u0430\u0432\u0442\u043E\u0440\u0443 \u0438\u043B\u0438 \u0442\u0435\u043A\u0441\u0442\u0443 \u043E\u0442\u0437\u044B\u0432\u0430...",
      value: revSearch,
      onChange: e => setRevSearch(e.target.value),
      style: {
        fontSize: '13px',
        padding: '6px 10px'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '5px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }
    }, "\u041E\u0446\u0435\u043D\u043A\u0430:"), ['all', '5', '4', '3', '2', '1'].map(rate => {
      const count = rate === 'all' ? reviews.length : reviews.filter(r => Number(r.rating) === Number(rate)).length;
      return /*#__PURE__*/React.createElement("button", {
        key: rate,
        type: "button",
        className: `btn btn-sm ${revRating === rate ? 'btn-primary' : 'btn-outline'}`,
        onClick: () => setRevRating(rate),
        style: {
          fontSize: '11px',
          padding: '3px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '3px'
        }
      }, /*#__PURE__*/React.createElement("span", null, rate === 'all' ? 'Все' : `${rate} ★`), /*#__PURE__*/React.createElement("span", {
        style: {
          opacity: 0.75
        }
      }, "(", count, ")"));
    })), (revSearch || revRating !== 'all') && /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-sm",
      onClick: () => {
        setRevSearch('');
        setRevRating('all');
      },
      style: {
        fontSize: '12px',
        color: 'var(--accent-color)',
        padding: '4px 6px'
      }
    }, "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C")), loading ? /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: 'center',
        padding: '20px'
      }
    }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043E\u0442\u0437\u044B\u0432\u043E\u0432...") : reviews.length === 0 ? /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: 'center',
        padding: '20px',
        color: 'var(--text-secondary)'
      }
    }, "\u041E\u0442\u0437\u044B\u0432\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442") : filteredReviews.length === 0 ? /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: 'center',
        padding: '20px',
        color: 'var(--text-secondary)'
      }
    }, "\u041E\u0442\u0437\u044B\u0432\u043E\u0432 \u043F\u043E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u043C \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u043C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E") : /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: '420px',
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("table", {
      className: "custom-table"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u2116"), /*#__PURE__*/React.createElement("th", null, "\u0423\u0441\u043B\u0443\u0433\u0430"), /*#__PURE__*/React.createElement("th", null, "\u0410\u0432\u0442\u043E\u0440"), /*#__PURE__*/React.createElement("th", null, "\u041E\u0446\u0435\u043D\u043A\u0430"), /*#__PURE__*/React.createElement("th", null, "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439"), /*#__PURE__*/React.createElement("th", null, "\u0414\u0430\u0442\u0430"), /*#__PURE__*/React.createElement("th", null, "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435"))), /*#__PURE__*/React.createElement("tbody", null, filteredReviews.map((r, idx) => /*#__PURE__*/React.createElement("tr", {
      key: r.id
    }, /*#__PURE__*/React.createElement("td", null, "\u2116 ", idx + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, r.service_name)), /*#__PURE__*/React.createElement("td", null, r.author_name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 'bold',
        color: r.rating >= 4 ? '#22c55e' : r.rating === 3 ? '#eab308' : '#ef4444'
      }
    }, r.rating, " \u0438\u0437 5")), /*#__PURE__*/React.createElement("td", {
      style: {
        maxWidth: '240px',
        fontSize: '13px'
      }
    }, r.comment), /*#__PURE__*/React.createElement("td", null, new Date(r.created_at).toLocaleDateString('ru-RU')), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-sm",
      style: {
        color: 'var(--danger-color)'
      },
      onClick: () => handleDeleteReview(r.id)
    }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C"))))))));
  })(), activeTab === 'users' && (() => {
    const filteredUsers = users.filter(u => {
      if (!userSearch.trim()) return true;
      const q = userSearch.trim().toLowerCase();
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q);
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        fontSize: '15px'
      }
    }, "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F\u043C\u0438 \u0438 \u0440\u043E\u043B\u044F\u043C\u0438 (", users.length, ")"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-outline btn-sm",
      onClick: loadUsers
    }, "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: '12px'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 \u043F\u043E \u0438\u043C\u0435\u043D\u0438, email, \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0443 \u0438\u043B\u0438 \u0440\u043E\u043B\u0438...",
      value: userSearch,
      onChange: e => setUserSearch(e.target.value),
      style: {
        fontSize: '13px',
        padding: '6px 10px'
      }
    })), loading ? /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: 'center',
        padding: '20px'
      }
    }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439...") : filteredUsers.length === 0 ? /*#__PURE__*/React.createElement("p", {
      style: {
        textAlign: 'center',
        padding: '20px',
        color: 'var(--text-secondary)'
      }
    }, userSearch ? 'Пользователей по запросу не найдено' : 'Список пользователей пуст') : /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: '420px',
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("table", {
      className: "custom-table"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u2116"), /*#__PURE__*/React.createElement("th", null, "\u0418\u043C\u044F"), /*#__PURE__*/React.createElement("th", null, "Email"), /*#__PURE__*/React.createElement("th", null, "\u0422\u0435\u043B\u0435\u0444\u043E\u043D"), /*#__PURE__*/React.createElement("th", null, "\u0420\u043E\u043B\u044C"), /*#__PURE__*/React.createElement("th", null, "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0440\u043E\u043B\u044C"), /*#__PURE__*/React.createElement("th", null, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C"))), /*#__PURE__*/React.createElement("tbody", null, filteredUsers.map((u, idx) => /*#__PURE__*/React.createElement("tr", {
      key: u.id
    }, /*#__PURE__*/React.createElement("td", null, "\u2116 ", idx + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, u.name)), /*#__PURE__*/React.createElement("td", null, u.email), /*#__PURE__*/React.createElement("td", null, formatPhoneNumber(u.phone) || u.phone || '—'), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: `badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`
    }, u.role === 'admin' ? 'Администратор' : 'Клиент')), /*#__PURE__*/React.createElement("td", null, u.email.toLowerCase() === 'admin@lavka.ru' ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        fontStyle: 'italic'
      }
    }, "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440") : u.id === currentUser?.id ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        fontStyle: 'italic'
      }
    }, "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442") : /*#__PURE__*/React.createElement("select", {
      value: u.role,
      onChange: e => handleRoleChange(u.id, e.target.value),
      style: {
        padding: '4px',
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
        background: 'var(--card-bg)',
        color: 'var(--text-primary)',
        fontSize: '12px'
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: "user"
    }, "\u041A\u043B\u0438\u0435\u043D\u0442 (user)"), /*#__PURE__*/React.createElement("option", {
      value: "admin"
    }, "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440 (admin)"))), /*#__PURE__*/React.createElement("td", null, u.email.toLowerCase() === 'admin@lavka.ru' || u.id === currentUser?.id ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)',
        fontSize: '12px'
      }
    }, "\u2014") : /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-sm",
      style: {
        color: 'var(--danger-color)'
      },
      onClick: () => handleDeleteUser(u.id),
      title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
    }, "\u2715"))))))));
  })()), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: onClose
  }, "\u0417\u0430\u043A\u0440\u044B\u0442\u044C"))), isServiceModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    style: {
      zIndex: 1100
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h3", null, editingService ? 'Редактирование услуги' : 'Новая услуга'), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: () => setIsServiceModalOpen(false)
  }, "\u2715")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSaveService
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, serviceModalError && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid var(--danger-color)',
      color: 'var(--danger-color)',
      padding: '8px 12px',
      borderRadius: '6px',
      marginBottom: '12px',
      fontSize: '13px'
    }
  }, "\u26A0\uFE0F ", serviceModalError), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0438:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u041F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u0430\u044F \u0443\u043A\u043B\u0430\u0434\u043A\u0430",
    value: sName,
    onChange: e => setSName(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u0443\u0441\u043B\u0443\u0433\u0438:"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: sCat,
    onChange: e => setSCat(e.target.value),
    required: true
  }, /*#__PURE__*/React.createElement("option", {
    value: "\u0411\u0435\u0437 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438"
  }, "\u0411\u0435\u0437 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438"), categories.filter(c => c.name !== 'Без категории').map(c => /*#__PURE__*/React.createElement("option", {
    key: c.name,
    value: c.name
  }, c.name)), /*#__PURE__*/React.createElement("option", {
    value: "__new__"
  }, "+ \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E..."))), sCat === '__new__' && /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginTop: '8px'
    }
  }, /*#__PURE__*/React.createElement("label", null, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043D\u043E\u0432\u043E\u0439 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0421\u043F\u0430-\u043F\u0440\u043E\u0446\u0435\u0434\u0443\u0440\u044B",
    value: sNewCatName,
    onChange: e => setSNewCatName(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u0411\u0430\u0437\u043E\u0432\u0430\u044F \u0446\u0435\u043D\u0430 (\u20BD):"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    className: "form-control",
    placeholder: "2500",
    value: sPrice,
    onChange: e => setSPrice(e.target.value),
    required: true
  }), sPrice !== '' && Number(sPrice) <= 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--danger-color)',
      marginTop: '4px',
      fontWeight: '500'
    }
  }, "\u26A0\uFE0F \u0426\u0435\u043D\u0430 \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u0441\u0442\u0440\u043E\u0433\u043E \u0431\u043E\u043B\u044C\u0448\u0435 0 \u20BD")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u0421\u043A\u0438\u0434\u043A\u0430 (%):"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    max: "99",
    step: "1",
    className: "form-control",
    placeholder: "0",
    value: sDiscount,
    onChange: e => setSDiscount(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      marginTop: '4px'
    }
  }, "\u041E\u0442 0 \u0434\u043E 99%")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041D\u0430 \u0441\u043A\u043B\u0430\u0434\u0435 (\u0448\u0442.):"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    className: "form-control",
    placeholder: "10",
    value: sStock,
    onChange: e => setSStock(e.target.value),
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      marginTop: '4px'
    }
  }, "\u041E\u0441\u0442\u0430\u0442\u043E\u043A \u0443\u0441\u043B\u0443\u0433/\u0442\u043E\u0432\u0430\u0440\u043E\u0432"))), sDiscount !== '' && (Number(sDiscount) < 0 || Number(sDiscount) >= 100) && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      borderRadius: '6px',
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid var(--danger-color)',
      color: 'var(--danger-color)',
      marginBottom: '14px',
      fontSize: '13px',
      fontWeight: '500'
    }
  }, Number(sDiscount) < 0 ? '⚠️ Ошибка: скидка не может быть меньше 0%' : '⚠️ Ошибка: скидка не может быть 100% или больше (максимум 99%)'), Number(sPrice) > 0 && Number(sDiscount) > 0 && Number(sDiscount) <= 99 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      borderRadius: '6px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      marginBottom: '14px',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u0418\u0442\u043E\u0433\u043E\u0432\u0430\u044F \u0446\u0435\u043D\u0430 \u0434\u043B\u044F \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432:"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      textDecoration: 'line-through',
      color: 'var(--text-secondary)',
      marginRight: '8px'
    }
  }, formatPrice(Number(sPrice))), /*#__PURE__*/React.createElement("strong", {
    style: {
      color: '#ef4444',
      fontSize: '15px'
    }
  }, formatPrice(calculateFinalPrice(sPrice, sDiscount)), " (-", sDiscount, "%)"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0443\u0441\u043B\u0443\u0433\u0438 (\u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C 6 \u0447\u0430\u0441\u043E\u0432 \u0440\u0430\u0431\u043E\u0442\u044B \u043C\u0430\u0441\u0442\u0435\u0440\u0430):"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      display: 'block',
      marginBottom: '3px'
    }
  }, "\u0427\u0430\u0441\u044B (0 - 6):"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    max: "6",
    className: "form-control",
    value: sHours,
    onChange: e => {
      const h = Math.min(6, Math.max(0, parseInt(e.target.value, 10) || 0));
      setSHours(h);
      if (h === 6) setSMinutes(0);
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      display: 'block',
      marginBottom: '3px'
    }
  }, "\u041C\u0438\u043D\u0443\u0442\u044B:"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: sMinutes,
    disabled: sHours >= 6,
    onChange: e => setSMinutes(Number(e.target.value))
  }, /*#__PURE__*/React.createElement("option", {
    value: 0
  }, "0 \u043C\u0438\u043D"), /*#__PURE__*/React.createElement("option", {
    value: 15
  }, "15 \u043C\u0438\u043D"), /*#__PURE__*/React.createElement("option", {
    value: 20
  }, "20 \u043C\u0438\u043D"), /*#__PURE__*/React.createElement("option", {
    value: 30
  }, "30 \u043C\u0438\u043D"), /*#__PURE__*/React.createElement("option", {
    value: 40
  }, "40 \u043C\u0438\u043D"), /*#__PURE__*/React.createElement("option", {
    value: 45
  }, "45 \u043C\u0438\u043D"), /*#__PURE__*/React.createElement("option", {
    value: 50
  }, "50 \u043C\u0438\u043D")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '6px',
      fontSize: '12px',
      color: sHours * 60 + sMinutes > 360 ? 'var(--danger-color)' : 'var(--accent-color)',
      fontWeight: '500'
    }
  }, sHours * 60 + sMinutes > 360 ? /*#__PURE__*/React.createElement("span", null, "\u26A0\uFE0F \u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0441\u043C\u0435\u043D\u044B \u043C\u0430\u0441\u0442\u0435\u0440\u0430 (\u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C 6 \u0447\u0430\u0441\u043E\u0432 / 360 \u043C\u0438\u043D\u0443\u0442)!") : /*#__PURE__*/React.createElement("span", null, "\u0418\u0442\u043E\u0433\u043E: ", /*#__PURE__*/React.createElement("strong", null, formatDuration(sHours * 60 + sMinutes)), " (", sHours * 60 + sMinutes, " \u043C\u0438\u043D \u0438\u0437 360 \u043C\u0430\u043A\u0441.)"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0438:"), /*#__PURE__*/React.createElement("textarea", {
    className: "form-control",
    rows: "3",
    value: sDesc,
    onChange: e => setSDesc(e.target.value),
    style: {
      resize: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "URL \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "/images/services/styling.jpg",
    value: sImg,
    onChange: e => setSImg(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline btn-sm",
    onClick: () => setSImg('/images/services/styling.jpg'),
    title: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u043E\u0435 \u0444\u043E\u0442\u043E",
    style: {
      whiteSpace: 'nowrap'
    }
  }, "\u0421\u0431\u0440\u043E\u0441"), sImg && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm",
    style: {
      color: 'var(--danger-color)',
      whiteSpace: 'nowrap'
    },
    onClick: () => setSImg(''),
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0444\u043E\u0442\u043E"
  }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C")), sImg && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '10px',
      padding: '8px 12px',
      background: 'rgba(0,0,0,0.03)',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: sImg,
    alt: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
    style: {
      width: '60px',
      height: '60px',
      objectFit: 'cover',
      borderRadius: '6px',
      border: '1px solid var(--border-color)'
    },
    onError: e => {
      e.target.onerror = null;
      e.target.src = '/images/services/styling.jpg';
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '13px',
      fontWeight: '500'
    }
  }, "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--text-secondary)'
    }
  }, "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440 \u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E\u0441\u0442\u044C \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u0434 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u043C"))))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: () => setIsServiceModalOpen(false)
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary"
  }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0443\u0441\u043B\u0443\u0433\u0443"))))), isEditCatModalOpen && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    style: {
      zIndex: 1100
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: '480px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h3", null, "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: () => setIsEditCatModalOpen(false)
  }, "\u2715")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSaveEditCategory
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, catModalError && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid var(--danger-color)',
      color: 'var(--danger-color)',
      padding: '8px 12px',
      borderRadius: '6px',
      marginBottom: '12px',
      fontSize: '13px'
    }
  }, "\u26A0\uFE0F ", catModalError), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: editCatName,
    onChange: e => setEditCatName(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438:"), /*#__PURE__*/React.createElement("textarea", {
    className: "form-control",
    rows: "3",
    value: editCatDesc,
    onChange: e => setEditCatDesc(e.target.value),
    style: {
      resize: 'none'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    onClick: () => setIsEditCatModalOpen(false)
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary"
  }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E"))))));
}

// App.jsx
// Главный функциональный компонент React-приложения
function App() {
  // Состояние пользователя
  const [user, setUser] = useState(null);

  // Состояние каталога услуг
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояние серверной корзины
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Маршрутизация на основе HTML5 History API (Browser Router)
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname || '/';
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [reviewsService, setReviewsService] = useState(null);
  const navigate = useCallback((path, replace = false) => {
    if (window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState({}, '', path);
      } else {
        window.history.pushState({}, '', path);
      }
    }
    setCurrentPath(path);
  }, []);

  // Синхронизация с кнопками браузера Вперед / Назад
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Тема оформления (светлая/тёмная)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Применение темы к HTML документу
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Загрузка текущего авторизованного пользователя
  const loadCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setAuthChecked(true);
      return;
    }
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (e) {
      console.warn('Токен недействителен, сброс сессии:', e.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  // Валидация и защита маршрутов
  useEffect(() => {
    if (!authChecked) return;
    if (currentPath === '/admin') {
      if (!user) {
        navigate('/login', true);
      } else if (user.role !== 'admin') {
        navigate('/', true);
      }
    } else if (currentPath === '/profile') {
      if (!user) {
        navigate('/login', true);
      }
    } else if (currentPath === '/cart' || currentPath === '/checkout') {
      if (user && user.role === 'admin') {
        navigate('/', true);
      }
    }
  }, [currentPath, user, authChecked, navigate]);

  // Загрузка корзины из базы данных
  const loadUserCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
      return;
    }
    try {
      const data = await getCart();
      setCartItems(data.items || []);
      setCartTotal(Number(data.total_amount) || 0);
      setCartCount(Number(data.total_count) || 0);
    } catch (e) {
      console.error('Ошибка при загрузке корзины:', e);
    }
  }, []);

  // Загрузка каталога услуг через API с JOIN-запросами
  const loadServicesList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getServices({
        category: selectedCategory,
        search: searchTerm,
        sort: sortOption
      });
      const list = Array.isArray(data) ? data : data && Array.isArray(data.services) ? data.services : [];
      setServices(list);
    } catch (err) {
      setError(err.message || 'Ошибка подключения к серверу API');
      console.error('Ошибка загрузки каталога:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, sortOption]);

  // Загрузка списка категорий
  const loadCategoriesList = async () => {
    try {
      const data = await getCategories();
      const list = Array.isArray(data) ? data : data && Array.isArray(data.categories) ? data.categories : [];
      setCategories(list);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

  // Инициализация при монтировании компонента
  useEffect(() => {
    loadCurrentUser();
    loadCategoriesList();
    loadServicesList();
  }, [loadServicesList]);

  // Загрузка корзины при изменении пользователя
  useEffect(() => {
    loadUserCart();
  }, [user, loadUserCart]);

  // Добавление услуги в корзину (с проверкой лимитов сеанса мастера: Вариант А)
  const handleAddToCart = async service => {
    if (!user) {
      navigate('/login');
      return;
    }

    // 1. Проверка на лимит одинаковых услуг (максимум 3 на один визит мастера)
    const existing = cartItems.find(i => i.service_id === service.id);
    if (existing && existing.quantity >= 3) {
      alert(`Один мастер не может выполнить процедуру "${service.name}" более 3 раз за один визит. Для дополнительных процедур оформите отдельную запись.`);
      return;
    }

    // 2. Проверка на суммарную длительность визита мастера (максимум 360 минут = 6 часов)
    const currentDuration = cartItems.reduce((sum, item) => sum + (Number(item.duration) || 60) * item.quantity, 0);
    const serviceDuration = Number(service.duration || service.duration_minutes || 60);
    if (currentDuration + serviceDuration > 360) {
      const curH = Math.floor(currentDuration / 60);
      const curM = currentDuration % 60;
      alert(`Превышен лимит рабочего времени мастера на один визит (максимум 6 часов).\nСейчас в корзине: ${curH > 0 ? `${curH} ч ` : ''}${curM} мин.\nУслуга "${service.name}" длится ${serviceDuration} мин. Оформите отдельную запись.`);
      return;
    }
    try {
      await addToCart(service.id, 1);
      await loadUserCart();
    } catch (e) {
      alert(e.message || 'Не удалось добавить в корзину');
    }
  };

  // Изменение количества в корзине (с валидацией лимитов мастера)
  const handleUpdateCartQty = async (serviceId, newQty) => {
    if (newQty > 3) {
      alert('Один мастер не может выполнить более 3 одинаковых процедур за один визит.');
      return;
    }
    const item = cartItems.find(i => i.service_id === serviceId);
    if (item && newQty > item.quantity) {
      const currentDuration = cartItems.reduce((sum, i) => sum + (Number(i.duration) || 60) * i.quantity, 0);
      const diff = (newQty - item.quantity) * (Number(item.duration) || 60);
      if (currentDuration + diff > 360) {
        alert('Превышен допустимый лимит времени мастера на один визит (максимум 6 часов).');
        return;
      }
    }
    try {
      await updateCartItem(serviceId, newQty);
      await loadUserCart();
    } catch (e) {
      alert(e.message);
    }
  };

  // Удаление позиции из корзины
  const handleRemoveCartItem = async serviceId => {
    try {
      await removeCartItem(serviceId);
      await loadUserCart();
    } catch (e) {
      alert(e.message);
    }
  };

  // Очистка корзины
  const handleClearCart = async () => {
    if (!window.confirm('Очистить корзину?')) return;
    try {
      await clearCart();
      await loadUserCart();
    } catch (e) {
      alert(e.message);
    }
  };

  // Выход из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCartItems([]);
    setCartTotal(0);
    setCartCount(0);
    navigate('/');
  };

  // Успешная авторизация
  const handleAuthSuccess = userData => {
    setUser(userData);
    loadUserCart();
    loadServicesList();
    navigate('/');
  };

  // Успешное оформление заказа
  const handleOrderSuccess = async () => {
    await loadUserCart();
    navigate('/profile');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "app-root"
  }, /*#__PURE__*/React.createElement(Navbar, {
    user: user,
    cartCount: cartCount,
    cartTotal: cartTotal,
    theme: theme,
    onToggleTheme: toggleTheme,
    onOpenAuth: () => navigate('/login'),
    onOpenProfile: () => navigate('/profile'),
    onOpenAdmin: () => navigate('/admin'),
    onOpenCart: () => navigate('/cart'),
    onGoHome: () => navigate('/'),
    onLogout: handleLogout
  }), /*#__PURE__*/React.createElement("div", {
    className: "main-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "banner-info"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435:"), " \u043D\u0430 \u0443\u0441\u043B\u0443\u0433\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0441\u0435\u0437\u043E\u043D\u043D\u0430\u044F \u0441\u043A\u0438\u0434\u043A\u0430 \u0434\u043E 30%!"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: '13px'
    }
  }, "\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0438 \u0432\u044B\u0435\u0437\u0434 \u043C\u0430\u0441\u0442\u0435\u0440\u0430 \u043D\u0430 \u0434\u043E\u043C")), /*#__PURE__*/React.createElement(Catalog, {
    services: services,
    categories: categories,
    selectedCategory: selectedCategory,
    onSelectCategory: setSelectedCategory,
    searchTerm: searchTerm,
    onSearchChange: setSearchTerm,
    sortOption: sortOption,
    onSortChange: setSortOption,
    loading: loading,
    error: error,
    onRetry: loadServicesList,
    onAddToCart: handleAddToCart,
    onOpenReviews: s => setReviewsService(s),
    isAdmin: user?.role === 'admin'
  })), /*#__PURE__*/React.createElement("footer", null, /*#__PURE__*/React.createElement("p", null, "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u043E\u043D\u043B\u0430\u0439\u043D-\u0437\u0430\u043A\u0430\u0437\u0430 \u0443\u0441\u043B\u0443\u0433 \u0438 \u0442\u043E\u0432\u0430\u0440\u043E\u0432 \xAB\u041B\u0430\u0432\u043A\u0430 \u0423\u0441\u043B\u0443\u0433\xBB \xA9 2026"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '12px',
      marginTop: '4px'
    }
  }, "\u041A\u0443\u0440\u0441\u043E\u0432\u043E\u0439 \u043F\u0440\u043E\u0435\u043A\u0442 \u043F\u043E React \u0438 \u0441\u0435\u0440\u0432\u0435\u0440\u043D\u044B\u043C API. PostgreSQL 18 & Express.")), /*#__PURE__*/React.createElement(AuthModal, {
    isOpen: currentPath === '/login' || currentPath === '/auth',
    onClose: () => navigate('/'),
    onAuthSuccess: handleAuthSuccess,
    onOpenForgotPassword: () => navigate('/forgot-password')
  }), /*#__PURE__*/React.createElement(ForgotPasswordModal, {
    isOpen: currentPath === '/forgot-password' || currentPath === '/forgot',
    onClose: () => navigate('/'),
    onOpenAuth: () => navigate('/login')
  }), user?.role !== 'admin' && /*#__PURE__*/React.createElement(CartModal, {
    isOpen: currentPath === '/cart',
    onClose: () => navigate('/'),
    cartItems: cartItems,
    cartTotal: cartTotal,
    cartCount: cartCount,
    user: user,
    onUpdateQty: handleUpdateCartQty,
    onRemoveItem: handleRemoveCartItem,
    onClearCart: handleClearCart,
    onOpenCheckout: () => navigate('/checkout'),
    onOpenAuth: () => navigate('/login')
  }), user?.role !== 'admin' && /*#__PURE__*/React.createElement(CheckoutModal, {
    isOpen: currentPath === '/checkout',
    onClose: () => navigate('/cart'),
    cartItems: cartItems,
    cartTotal: cartTotal,
    user: user,
    onOrderSuccess: handleOrderSuccess
  }), /*#__PURE__*/React.createElement(ReviewsModal, {
    service: reviewsService,
    user: user,
    isOpen: Boolean(reviewsService),
    onClose: () => setReviewsService(null),
    onOpenAuth: () => navigate('/login'),
    onReviewAdded: loadServicesList
  }), /*#__PURE__*/React.createElement(ProfileModal, {
    isOpen: currentPath === '/profile',
    onClose: () => navigate('/'),
    user: user,
    onProfileUpdated: updated => setUser(updated)
  }), /*#__PURE__*/React.createElement(AdminPanel, {
    isOpen: currentPath === '/admin' && user?.role === 'admin',
    onClose: () => navigate('/'),
    services: services,
    categories: categories,
    onServicesChanged: loadServicesList,
    onCategoriesChanged: () => {
      loadCategoriesList();
      loadServicesList();
    },
    currentUser: user
  }));
}

  function mountApp() {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      const root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(App));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
  } else {
    mountApp();
  }
})();
