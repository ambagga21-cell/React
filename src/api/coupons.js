import { apiRequest } from './auth';

// Проверка и расчет скидки по промокоду
export async function validateCoupon(code) {
  return await apiRequest(`/coupons/validate/${encodeURIComponent(code)}`);
}

// Получение всех промокодов (для админа)
export async function getCoupons() {
  return await apiRequest('/coupons');
}

// Создание промокода (для админа)
export async function createCoupon(data) {
  return await apiRequest('/coupons', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
