const API_URL = 'http://localhost:3001/api/admin';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getAdminStats() {
  const response = await fetch(`${API_URL}/stats`, { headers: getHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка получения статистики');
  return data;
}

export async function getAdminOrders() {
  const response = await fetch(`${API_URL}/orders`, { headers: getHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка получения списка заказов');
  return data;
}

export async function updateOrderStatus(orderId, status) {
  const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка смены статуса заказа');
  return data;
}

export async function deleteOrder(orderId) {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка удаления заказа');
  return data;
}

export async function getAdminUsers() {
  const response = await fetch(`${API_URL}/users`, { headers: getHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка получения списка пользователей');
  return data;
}

export async function updateUserRole(userId, role) {
  const response = await fetch(`${API_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ role })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка изменения роли');
  return data;
}

export async function deleteUser(userId) {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка удаления пользователя');
  return data;
}

export async function getAdminReviews(params = {}) {
  const query = new URLSearchParams();
  if (params && params.search) query.append('search', params.search);
  if (params && params.rating && params.rating !== 'all') query.append('rating', params.rating);
  const qStr = query.toString();
  const url = `${API_URL}/reviews${qStr ? '?' + qStr : ''}`;
  const response = await fetch(url, { headers: getHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка получения отзывов');
  return data;
}

export async function deleteReview(reviewId) {
  const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка удаления отзыва');
  return data;
}
