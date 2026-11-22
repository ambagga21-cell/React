import { formatDuration, formatPrice } from '../utils/formatters';

// Модальное окно корзины с управлением количеством, удалением и переходом к оформлению
export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  cartTotal,
  cartCount,
  user,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
  onOpenAuth
}) {
  if (!isOpen) return null;

  // Расчет суммарной длительности сеанса мастера (максимум 360 минут = 6 часов)
  const totalDuration = cartItems.reduce(
    (sum, item) => sum + ((Number(item.duration) || 60) * item.quantity),
    0
  );
  const maxSessionMinutes = 360;
  const durationHours = Math.floor(totalDuration / 60);
  const durationMins = totalDuration % 60;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Ваша корзина</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {cartCount > 0 ? `Выбрано позиций: ${cartCount}` : 'Корзина пуста'}
              </span>
              {cartItems.length > 0 && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: totalDuration >= 300 ? '#fef3c7' : 'rgba(0,0,0,0.06)',
                  color: totalDuration >= 300 ? '#b45309' : 'var(--text-secondary)',
                  border: totalDuration >= 300 ? '1px solid #fde68a' : 'none'
                }}>
                  ⏱ Время сеанса мастера: {durationHours > 0 ? `${durationHours} ч ` : ''}{durationMins} мин / макс. 6 ч
                </span>
              )}
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Если пользователь не авторизован */}
          {!user && (
            <div style={{
              background: 'var(--warning-bg)',
              color: 'var(--text-primary)',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px'
            }}>
              <span>Для сохранения корзины на сервере войдите в систему</span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
              >
                Войти
              </button>
            </div>
          )}

          {/* Пустая корзина */}
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <h4>В вашей корзине пока ничего нет</h4>
              <p style={{ fontSize: '14px', marginTop: '6px' }}>Выберите желаемые услуги в нашем каталоге</p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                onClick={onClose}
              >
                Перейти в каталог
              </button>
            </div>
          ) : (
            <div>
              {/* Список позиций в корзине */}
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {cartItems.map((item) => (
                  <div key={item.service_id} className="cart-item-row">
                    <img
                      src={item.image_url || '/images/services/styling.jpg'}
                      alt={item.service_name}
                      style={{ width: '56px', height: '56px', borderRadius: '6px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/services/styling.jpg';
                      }}
                    />

                    <div className="cart-item-info">
                      <div className="cart-item-title">{item.service_name}</div>
                      <div className="cart-item-category">
                        {item.category_name} • ⏱ {formatDuration(item.duration)}
                      </div>
                      <div style={{ fontSize: '13px', marginTop: '3px' }}>
                        {item.discount_percent > 0 ? (
                          <span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', marginRight: '6px' }}>
                              {formatPrice(item.price)}
                            </span>
                            <strong style={{ color: '#ef4444' }}>
                              {formatPrice(item.final_price !== undefined ? item.final_price : calculateFinalPrice(item.price, item.discount_percent))} / шт.
                            </strong>
                            <span className="badge-discount" style={{ marginLeft: '6px', fontSize: '11px' }}>
                              -{item.discount_percent}%
                            </span>
                          </span>
                        ) : (
                          <strong style={{ color: 'var(--accent-color)' }}>
                            {formatPrice(item.price)} / шт.
                          </strong>
                        )}
                      </div>
                    </div>

                    {/* Управление количеством */}
                    <div className="cart-qty-controls">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => onUpdateQty(item.service_id, item.quantity - 1)}
                        title="Уменьшить количество"
                      >
                        -
                      </button>

                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>
                        {item.quantity}
                      </span>

                      {(() => {
                        const itemDur = Number(item.duration) || 60;
                        const isQtyLimit = item.quantity >= 3;
                        const isTimeLimit = (totalDuration + itemDur) > maxSessionMinutes;
                        const isPlusDisabled = isQtyLimit || isTimeLimit;

                        return (
                          <button
                            type="button"
                            className="cart-qty-btn"
                            onClick={() => onUpdateQty(item.service_id, item.quantity + 1)}
                            disabled={isPlusDisabled}
                            title={
                              isQtyLimit
                                ? "Один мастер не может выполнить более 3 одинаковых процедур за один визит"
                                : isTimeLimit
                                ? "Превышен лимит времени мастера на один визит (максимум 6 часов)"
                                : "Увеличить количество"
                            }
                            style={{
                              opacity: isPlusDisabled ? 0.35 : 1,
                              cursor: isPlusDisabled ? 'not-allowed' : 'pointer'
                            }}
                          >
                            +
                          </button>
                        );
                      })()}
                    </div>

                    {/* Стоимость позиции */}
                    <div style={{ minWidth: '90px', textAlign: 'right', fontWeight: 'bold' }}>
                      {formatPrice(item.item_total)}
                    </div>

                    {/* Кнопка удаления */}
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ color: 'var(--danger-color)', padding: '4px 8px' }}
                      onClick={() => onRemoveItem(item.service_id)}
                      title="Удалить услугу из корзины"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Итоговая сумма корзины */}
              <div style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '2px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--danger-color)' }}
                  onClick={onClearCart}
                >
                  Очистить корзину
                </button>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginRight: '10px' }}>Итого к оплате:</span>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Продолжить выбор
          </button>

          {cartItems.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!user) {
                  alert('Для оформления заказа необходимо войти в аккаунт');
                  onClose();
                  onOpenAuth();
                  return;
                }
                onClose();
                onOpenCheckout();
              }}
            >
              Оформить заказ →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
