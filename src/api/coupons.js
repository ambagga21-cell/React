const API_URL = 'http://localhost:3001/api/coupons';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Проверка и расчет скидки по промокоду
export async function validateCoupon(code) {
  const response = await fetch(`${API_URL}/validate/${encodeURIComponent(code)}`, {
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка проверки промокода');
  }
  return data;
}

// Получение всех промокодов (для админа)
export async function getCoupons() {
  const response = await fetch(API_URL, {
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось получить промокоды');
  }
  return data;
}

// Создание промокода (для админа)
export async function createCoupon(data) {
  const response = await fetch(API_URL, {
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
export async function deleteCoupon(id) {
  const response = await fetch(`${API_URL}/${id}`, {
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
export async function toggleCoupon(id) {
  const response = await fetch(`${API_URL}/${id}/toggle`, {
    method: 'PUT',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось обновить промокод');
  }
  return data;
}
