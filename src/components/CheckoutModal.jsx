import { useState, useEffect } from 'react';
import { createOrder } from '../api/orders';

// Модальное окно оформления заказа с валидацией адреса и даты доставки
export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  cartTotal,
  user,
  onOrderSuccess
}) {
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Минимальная дата доставки — сегодня
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user && user.default_address) {
      setDeliveryAddress(user.default_address);
    }
    // По умолчанию ставим завтрашний день
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Валидация адреса доставки
    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      setErrorMsg('Пожалуйста, укажите полный адрес доставки (улица, дом, квартира)');
      return;
    }

    // Валидация даты доставки (Requirement 2.3: не может быть меньше текущей даты)
    if (!deliveryDate) {
      setErrorMsg('Пожалуйста, выберите дату доставки');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const chosen = new Date(deliveryDate);
    chosen.setHours(0, 0, 0, 0);

    if (chosen < today) {
      setErrorMsg('Дата доставки не может быть меньше текущей даты (валидация)');
      return;
    }

    try {
      setLoading(true);
      const res = await createOrder({
        delivery_address: deliveryAddress.trim(),
        delivery_date: deliveryDate
      });

      alert(res.message);
      if (onOrderSuccess) onOrderSuccess(res.order);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка оформления заказа');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Оформление заказа</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
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

            {/* Сводка заказа */}
            <div style={{
              background: 'rgba(0,0,0,0.03)',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span>Количество позиций:</span>
                <strong>{cartItems.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span>Сумма к оплате:</span>
                <strong style={{ color: 'var(--accent-color)' }}>{typeof formatPrice === 'function' ? formatPrice(cartTotal) : `${cartTotal} ₽`}</strong>
              </div>
            </div>

            {/* Поле: Адрес доставки */}
            <div className="form-group">
              <label>Адрес доставки / выезда мастера:</label>
              <input
                type="text"
                className="form-control"
                placeholder="г. Москва, ул. Ленина, д. 10, кв. 25"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Будет сохранен в профиле как адрес по умолчанию.
              </span>
            </div>

            {/* Поле: Дата доставки (валидация min=today) */}
            <div className="form-group">
              <label>Дата доставки / оказания услуги:</label>
              <input
                type="date"
                className="form-control"
                min={todayStr}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                * Дата доставки не может быть меньше сегодняшнего дня.
              </span>
            </div>

            <div className="form-group">
              <label>Получатель:</label>
              <input
                type="text"
                className="form-control"
                value={`${user ? user.name : ''} (${user ? user.phone || user.email : ''})`}
                disabled
                style={{ opacity: 0.8 }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение заказа на сервере...' : `Подтвердить заказ (${typeof formatPrice === 'function' ? formatPrice(cartTotal) : `${cartTotal} ₽`})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
