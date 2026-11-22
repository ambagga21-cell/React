import { useState } from 'react';
import { loginUser, registerUser, formatPhoneNumber } from '../api/auth';

// Модальное окно авторизации и регистрации
export default function AuthModal({
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
  const handleLoginSubmit = async (e) => {
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
  const handleRegisterSubmit = async (e) => {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="tabs-nav" style={{ margin: 0, border: 'none' }}>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            >
              Вход
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            >
              Регистрация
            </button>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {errorMsg && (
            <div style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger-color)',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '16px',
              fontWeight: '500'
            }}>
              {errorMsg}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Электронная почта (Email):</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@lavka.ru"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Пароль:</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '13px', cursor: 'pointer' }}
                  onClick={() => {
                    onClose();
                    onOpenForgotPassword();
                  }}
                >
                  Забыли пароль?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
                disabled={loading}
              >
                {loading ? 'Проверка данных...' : 'Войти'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label>Полное имя (ФИО):</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Иван Иванов"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Электронная почта (Email):</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="user@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Пароль (минимум 6 символов):</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Номер телефона:</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+7 (999) 000-00-00"
                  maxLength={18}
                  value={regPhone}
                  onChange={(e) => setRegPhone(formatPhoneNumber(e.target.value))}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Ровно 11 цифр: +7 (XXX) XXX-XX-XX
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
                disabled={loading}
              >
                {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
