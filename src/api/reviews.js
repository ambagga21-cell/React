const API_URL = 'http://localhost:3001/api/reviews';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getServiceReviews(serviceId, params = {}) {
  const query = new URLSearchParams();
  if (params && params.search) query.append('search', params.search);
  if (params && params.rating && params.rating !== 'all') query.append('rating', params.rating);
  const qStr = query.toString();
  const url = `${API_URL}/service/${serviceId}${qStr ? '?' + qStr : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Ошибка при загрузке отзывов');
  }
  return await response.json();
}

export async function addReview(reviewData) {
  const response = await fetch(API_URL, {
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
