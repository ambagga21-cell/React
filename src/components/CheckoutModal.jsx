import { useState, useEffect } from 'react';
import { createOrder } from '../api/orders';
import { validateCoupon } from '../api/coupons';

// Модальное окно оформления заказа с валидацией адреса, даты доставки и промокодами
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

  // Промокод
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState(null);

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
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMsg(null);
  }, [user, isOpen]);

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) {
      setCouponMsg({ type: 'error', text: 'Введите промокод' });
      return;
    }

    try {
      setCouponLoading(true);
      setCouponMsg(null);
      const res = await validateCoupon(couponInput.trim());
      setAppliedCoupon(res);
      setCouponMsg({ type: 'success', text: `Промокод "${res.code}" применен! Скидка: -${res.discount_percent}%` });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMsg({ type: 'error', text: err.message || 'Промокод не найден' });
    } finally {
      setCouponLoading(false);
    }
  };

  const discountAmount = appliedCoupon ? Math.round(cartTotal * (appliedCoupon.discount_percent / 100)) : 0;
  const finalTotal = Math.max(0, cartTotal - discountAmount);

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
        delivery_date: deliveryDate,
        coupon_code: appliedCoupon ? appliedCoupon.code : null
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span>Сумма без промокода:</span>
                <span>{cartTotal.toLocaleString('ru-RU')} ₽</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', color: '#16a34a' }}>
                  <span>Промокод ({appliedCoupon.code} -{appliedCoupon.discount_percent}%):</span>
                  <strong>-{discountAmount.toLocaleString('ru-RU')} ₽</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                <span>Итого к оплате:</span>
                <strong style={{ color: 'var(--accent-color)' }}>{finalTotal.toLocaleString('ru-RU')} ₽</strong>
              </div>
            </div>

            {/* Промокод */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Промокод на скидку:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="LAVKA10, BEAUTY15, STUDENT20"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {couponLoading ? '...' : 'Применить'}
                </button>
              </div>
              {couponMsg && (
                <div style={{
                  fontSize: '12px',
                  marginTop: '4px',
                  color: couponMsg.type === 'success' ? '#16a34a' : 'var(--danger-color)',
                  fontWeight: '500'
                }}>
                  {couponMsg.text}
                </div>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '3px' }}>
                Активные промокоды: <strong>LAVKA10</strong> (-10%), <strong>BEAUTY15</strong> (-15%), <strong>STUDENT20</strong> (-20%)
              </span>
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
              {loading ? 'Сохранение заказа на сервере...' : `Подтвердить заказ (${finalTotal.toLocaleString('ru-RU')} ₽)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
