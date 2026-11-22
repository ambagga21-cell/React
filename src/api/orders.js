const API_URL = 'http://localhost:3001/api/orders';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function createOrder(orderData) {
  const response = await fetch(API_URL, {
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

export async function getMyOrders() {
  const response = await fetch(`${API_URL}/my`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Ошибка при получении истории заказов');
  }
  return await response.json();
}
