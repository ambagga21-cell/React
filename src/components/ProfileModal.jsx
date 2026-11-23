import { useState, useEffect } from 'react';
import { getMyOrders } from '../api/orders';
import { updateProfile, changePassword, formatPhoneNumber } from '../api/auth';

// Модальное окно личного кабинета (заказы, профиль, сброс/смена пароля)
export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'info' | 'security'
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Редактирование профиля
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState(null);

  // Смена пароля
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.default_address || '');
      loadOrders();
    }
  }, [isOpen, user]);

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const data = await getMyOrders();
      setOrders(data);
    } catch (err) {
      setOrdersError(err.message || 'Ошибка загрузки истории заказов');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setInfoMsg({ type: 'error', text: 'Имя должно содержать не менее 2 символов' });
      return;
    }
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/;
    if (!nameRegex.test(trimmedName)) {
      setInfoMsg({ type: 'error', text: 'Имя может содержать только буквы, дефисы и пробелы' });
      return;
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setInfoMsg({ type: 'error', text: 'Введите корректный адрес электронной почты (Email)' });
      return;
    }

    const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
    if (phone && phoneDigits.length !== 11) {
      setInfoMsg({ type: 'error', text: 'Номер телефона должен содержать ровно 11 цифр (например, +7 (911) 811-21-22)' });
      return;
    }

    const trimmedAddress = address.trim();
    if (trimmedAddress && trimmedAddress.length < 5) {
      setInfoMsg({ type: 'error', text: 'Адрес должен содержать не менее 5 символов' });
      return;
    }

    try {
      setInfoSaving(true);
      const res = await updateProfile({
        name: trimmedName,
        email: trimmedEmail,
        phone: phone.trim(),
        default_address: trimmedAddress
      });
      localStorage.setItem('token', res.token);
      onProfileUpdated(res.user);
      setInfoMsg({ type: 'success', text: res.message });
    } catch (err) {
      setInfoMsg({ type: 'error', text: err.message || 'Ошибка обновления данных' });
    } finally {
      setInfoSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'Новый пароль должен содержать не менее 6 символов' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'Новые пароли не совпадают' });
      return;
    }

    try {
      setPwdSaving(true);
      const res = await changePassword(oldPassword, newPassword);
      setPwdMsg({ type: 'success', text: res.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.message || 'Ошибка смены пароля' });
    } finally {
      setPwdSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Личный кабинет</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {user.name} ({user.role === 'admin' ? 'Администратор' : 'Клиент'})
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Навигация по вкладкам кабинета */}
          <div className="tabs-nav">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Мои заказы ({orders.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Личные данные
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Безопасность и пароль
            </button>
          </div>

          {/* Вкладка 1: История заказов */}
          {activeTab === 'orders' && (
            <div>
              {ordersLoading && <p style={{ textAlign: 'center', padding: '20px' }}>Загрузка заказов...</p>}
              {ordersError && <p style={{ color: 'var(--danger-color)', textAlign: 'center' }}>{ordersError}</p>}

              {!ordersLoading && orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                  <p>Вы пока не оформили ни одного заказа.</p>
                </div>
              )}

              {!ordersLoading && orders.length > 0 && (
                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>№</th>
                        <th>Дата доставки</th>
                        <th>Адрес доставки</th>
                        <th>Состав услуг</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o, index) => (
                        <tr key={o.id}>
                          <td><strong>№ {index + 1}</strong></td>
                          <td>{new Date(o.delivery_date).toLocaleDateString('ru-RU')}</td>
                          <td>{o.delivery_address}</td>
                          <td style={{ maxWidth: '240px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>{o.items_summary}</div>
                            {o.coupon_code && (
                              <div style={{
                                display: 'inline-block',
                                marginTop: '4px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#16a34a',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}>
                                🎟 Купон: {o.coupon_code} (-{Number(o.discount_amount).toLocaleString('ru-RU')} ₽)
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>
                            {Number(o.total_price).toLocaleString('ru-RU')} ₽
                          </td>
                          <td>
                            <span className="badge" style={{
                              background: o.status === 'Выполнен' ? '#10b981' : o.status === 'Отменен' ? '#ef4444' : '#0284c7',
                              color: '#ffffff'
                            }}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Вкладка 2: Редактирование личных данных */}
          {activeTab === 'info' && (
            <form onSubmit={handleInfoSubmit} style={{ maxWidth: '480px', margin: '0 auto' }}>
              {infoMsg && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '13px',
                  background: infoMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: infoMsg.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'
                }}>
                  {infoMsg.text}
                </div>
              )}

              <div className="form-group">
                <label>Полное имя (ФИО):</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Электронная почта (Email):</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Контактный телефон:</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+7 (999) 000-00-00"
                  maxLength={18}
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Ровно 11 цифр: +7 (XXX) XXX-XX-XX
                </span>
              </div>

              <div className="form-group">
                <label>Адрес доставки по умолчанию:</label>
                <input
                  type="text"
                  className="form-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="г. Москва, ул. Ленина, д. 10"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                disabled={infoSaving}
              >
                {infoSaving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </form>
          )}

          {/* Вкладка 3: Смена пароля */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '480px', margin: '0 auto' }}>
              {pwdMsg && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '13px',
                  background: pwdMsg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: pwdMsg.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'
                }}>
                  {pwdMsg.text}
                </div>
              )}

              <div className="form-group">
                <label>Текущий пароль:</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
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

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                disabled={pwdSaving}
              >
                {pwdSaving ? 'Обновление...' : 'Обновить пароль'}
              </button>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
