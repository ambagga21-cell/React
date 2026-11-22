const API_URL = 'http://localhost:3001/api/services';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getServices(filters = {}) {
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

  const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
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

export async function getServiceById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error('Ошибка при получении информации об услуге');
  }
  return await response.json();
}

export async function createService(serviceData) {
  const response = await fetch(API_URL, {
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

export async function updateService(id, serviceData) {
  const response = await fetch(`${API_URL}/${id}`, {
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

export async function deleteService(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при удалении услуги');
  }
  return data;
}
