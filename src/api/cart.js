const API_URL = 'http://localhost:3001/api/cart';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getCart() {
  const response = await fetch(API_URL, {
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

export async function addToCart(service_id, quantity = 1) {
  const response = await fetch(API_URL, {
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

export async function updateCartItem(service_id, quantity) {
  const response = await fetch(`${API_URL}/${service_id}`, {
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

export async function removeCartItem(service_id) {
  const response = await fetch(`${API_URL}/${service_id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка удаления из корзины');
  }
  return data;
}

export async function clearCart() {
  const response = await fetch(API_URL, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка очистки корзины');
  }
  return data;
}
