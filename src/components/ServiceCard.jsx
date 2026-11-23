import { formatDuration, formatPrice, calculateFinalPrice } from '../utils/formatters';

// Карточка услуги в каталоге (все данные подтягиваются через JOIN)
export default function ServiceCard({
  service,
  onAddToCart,
  onOpenReviews,
  isAdmin = false
}) {
  if (!service) return null;

  const rating = Number(service.average_rating) || 0;
  const reviewsCount = service.reviews_count || 0;
  const duration = service.duration || service.duration_minutes || 60;
  const stock = service.stock !== undefined ? Number(service.stock) : 10;
  
  const originalPrice = Number(service.price || 0);
  const discountPercent = Number(service.discount_percent || 0);
  const finalPrice = discountPercent > 0
    ? Number(service.final_price !== undefined ? service.final_price : calculateFinalPrice(originalPrice, discountPercent))
    : originalPrice;

  return (
    <div className="service-card">
      <img
        src={service.image_url || '/images/services/styling.jpg'}
        alt={service.name}
        className="service-card-img"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/images/services/styling.jpg';
        }}
      />

      <div className="service-card-body">
        <div className="service-card-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: 'rgba(2, 132, 199, 0.12)',
              color: 'var(--accent-color)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              {service.category_name || 'Без категории'}
            </span>
            {discountPercent > 0 && (
              <span className="discount-badge">
                -{discountPercent}%
              </span>
            )}
          </div>

          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>
            {formatDuration(duration)}
          </span>
        </div>

        <h3 className="service-card-title">{service.name}</h3>

        <p className="service-card-desc">{service.description}</p>

        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onOpenReviews(service)}
            style={{ fontSize: '12px', padding: '3px 8px' }}
            title="Посмотреть отзывы"
          >
            ★ {rating > 0 ? rating.toFixed(1) : 'нет оценок'} ({reviewsCount})
          </button>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: stock > 0 ? (stock <= 3 ? '#f59e0b' : 'var(--text-secondary)') : 'var(--danger-color)'
          }}>
            {stock > 0 ? `Остаток: ${stock} шт.` : 'Нет в наличии'}
          </span>
        </div>

        <div className="service-card-footer">
          <div className="service-price">
            {discountPercent > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="old-price">
                  {formatPrice(originalPrice)}
                </span>
                <span className="new-price">
                  {formatPrice(finalPrice)}
                </span>
              </div>
            ) : (
              <span className="current-price">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {!isAdmin && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onAddToCart(service)}
              disabled={stock <= 0}
              style={stock <= 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {stock > 0 ? 'В корзину' : 'Распродано'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
