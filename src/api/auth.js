const BASE_URL = 'http://localhost:3001/api/auth';

// Форматирование телефонного номера: строго 11 цифр, маска +7 (XXX) XXX-XX-XX
export function formatPhoneNumber(val) {
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

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginUser(email, password) {
  const response = await fetch(`${BASE_URL}/login`, {
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

export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/register`, {
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

export async function getMe() {
  const response = await fetch(`${BASE_URL}/me`, {
    headers: getHeaders()
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось получить данные профиля');
  }
  return data.user;
}

export async function sendPasswordResetCode(email) {
  const response = await fetch(`${BASE_URL}/forgot-password/send-code`, {
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

export async function resetPasswordWithEmailCode(email, code, new_password) {
  const response = await fetch(`${BASE_URL}/forgot-password/reset-with-code`, {
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

export async function getForgotQuestion(email) {
  const response = await fetch(`${BASE_URL}/forgot-password/question`, {
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

export async function resetPasswordWithAnswer(email, security_answer, new_password) {
  const response = await fetch(`${BASE_URL}/forgot-password/reset`, {
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

export async function updateProfile(profileData) {
  const response = await fetch(`${BASE_URL}/profile`, {
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

export async function changePassword(old_password, new_password) {
  const response = await fetch(`${BASE_URL}/change-password`, {
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
