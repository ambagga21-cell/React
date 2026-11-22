const API_URL = 'http://localhost:3001/api/categories';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getCategories() {
  const response = await fetch(API_URL);
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

export async function createCategory(categoryData) {
  const response = await fetch(API_URL, {
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

export async function updateCategory(id, categoryData) {
  const response = await fetch(`${API_URL}/${id}`, {
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

export async function deleteCategory(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка при удалении категории');
  }
  return data;
}
