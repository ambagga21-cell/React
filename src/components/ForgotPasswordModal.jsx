import { useState, useEffect } from 'react';
import { sendPasswordResetCode, resetPasswordWithEmailCode } from '../api/auth';

// Модальное окно восстановления пароля через Email с 6-значным проверочным кодом
export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onOpenAuth
}) {
  const [step, setStep] = useState(1); // 1: ввод email, 2: ввод кода из письма и нового пароля, 3: успех
  const [email, setEmail] = useState('ambagga21@gmail.com');
  const [code, setCode] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Сброс формы к начальному состоянию (Шаг 1)
  const resetForm = () => {
    setStep(1);
    setCode('');
    setPreviewUrl(null);
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Сброс состояния при каждом открытии модального окна
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  // Шаг 1: Запрос кода восстановления на Email
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Введите корректный адрес электронной почты');
      return;
    }

    try {
      setLoading(true);
      const res = await sendPasswordResetCode(cleanEmail);
      if (res && res.preview_url) {
        setPreviewUrl(res.preview_url);
      }
      setCode('');
      setStep(2);

      // Запрос разрешения на браузерные уведомления на рабочем столе
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка отправки кода на email');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: Проверка кода и установка нового пароля
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code || code.trim().length < 4) {
      setErrorMsg('Введите проверочный код из письма');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Пароли не совпадают');
      return;
    }

    try {
      setLoading(true);
      const res = await resetPasswordWithEmailCode(email.trim().toLowerCase(), code.trim(), newPassword);
      setSuccessMsg(res.message);
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Восстановление доступа к аккаунту</h3>
          <button type="button" className="modal-close-btn" onClick={handleModalClose}>✕</button>
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
              ⚠️ {errorMsg}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                Введите адрес электронной почты, указанный при регистрации. Мы отправим на него письмо с проверочным кодом для смены пароля.
              </p>

              <div className="form-group">
                <label>Электронная почта (Email):</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ambagga21@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'Отправка письма...' : '✉️ Отправить проверочный код'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit}>
              <div style={{
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  ✉️ Письмо с кодом отправлено на: <strong>{email}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Проверьте входящие сообщения (и папку «Спам»). Код действителен 15 минут.
                </div>
                {previewUrl && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(2, 132, 199, 0.3)' }}>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'underline', fontWeight: '500' }}
                    >
                      📬 Открыть входящее письмо в онлайн-почте ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Проверочный код из письма (6 цифр):</label>
                <input
                  type="text"
                  name="recovery_code"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="off"
                  className="form-control"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  style={{ letterSpacing: '4px', fontWeight: 'bold', fontSize: '18px', textAlign: 'center' }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Новый пароль (минимум 6 символов):</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Подтвердите новый пароль:</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Изменить Email
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Проверка кода...' : 'Установить новый пароль'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>✓</div>
              <h4 style={{ color: 'var(--success-color)', marginBottom: '10px' }}>Пароль успешно обновлен!</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {successMsg || 'Теперь вы можете войти в систему с вашим новым паролем.'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleModalClose();
                  onOpenAuth();
                }}
              >
                Войти в аккаунт
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
