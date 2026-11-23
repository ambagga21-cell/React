import { useState } from 'react';
import ServiceCard from './ServiceCard';

// Компонент каталога услуг с фильтрацией, поиском и обработкой ошибок API
export default function Catalog({
  services = [],
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  searchTerm = '',
  onSearchChange,
  sortOption = 'default',
  onSortChange,
  loading = false,
  error = null,
  onRetry,
  onAddToCart,
  onOpenReviews,
  isAdmin = false
}) {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyDiscount, setOnlyDiscount] = useState(false);

  // Защита от непредвиденных форматов ответа: всегда приводим к массиву
  const safeServices = Array.isArray(services)
    ? services
    : (services && Array.isArray(services.services) ? services.services : []);

  const safeCategories = Array.isArray(categories)
    ? categories
    : (categories && Array.isArray(categories.categories) ? categories.categories : []);

  // Локальная фильтрация по диапазону цен и скидкам
  const filteredServices = safeServices.filter((s) => {
    if (!s) return false;
    if (onlyDiscount && (!s.discount_percent || Number(s.discount_percent) <= 0)) {
      return false;
    }
    const price = Number(s.final_price || s.price || 0);
    if (minPrice && price < Number(minPrice)) return false;
    if (maxPrice && price > Number(maxPrice)) return false;
    return true;
  });

  return (
    <div className="catalog-layout">
      <aside className="filters-sidebar">
        <div className="filters-header">
          <h2>Категории услуг</h2>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onSelectCategory('all')}
              style={{ color: 'var(--accent-color)', padding: 0 }}
            >
              Сбросить
            </button>
          )}
        </div>

        <div>
          <div
            className={`category-filter-item ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => onSelectCategory('all')}
          >
            <span>Все категории</span>
            <span className="count-badge">{safeServices.length}</span>
          </div>

          {safeCategories.map((cat) => (
            <div
              key={cat.id || cat.name}
              className={`category-filter-item ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.name)}
            >
              <span>{cat.name}</span>
              <span className="count-badge">{cat.services_count || 0}</span>
            </div>
          ))}

          {!safeCategories.some((c) => c.name === 'Без категории') && (
            <div
              className={`category-filter-item ${selectedCategory === 'Без категории' ? 'active' : ''}`}
              onClick={() => onSelectCategory('Без категории')}
            >
              <span>Без категории</span>
              <span className="count-badge">
                {safeServices.filter((s) => !s.category_name || s.category_name === 'Без категории').length}
              </span>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Фильтр по цене (₽)</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              placeholder="От"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="form-control"
              style={{ padding: '6px 8px', fontSize: '13px' }}
            />
            <input
              type="number"
              placeholder="До"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="form-control"
              style={{ padding: '6px 8px', fontSize: '13px' }}
            />
          </div>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => { setMinPrice(''); setMaxPrice(''); }}
              style={{ marginTop: '8px', width: '100%' }}
            >
              Сбросить цену
            </button>
          )}
        </div>
      </aside>

      <section>
        <div className="catalog-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск услуги по названию или описанию..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <select
            className="select-input"
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="default">Сортировка по умолчанию</option>
            <option value="price_asc">Сначала недорогие</option>
            <option value="price_desc">Сначала премиальные</option>
            <option value="rating">По рейтингу отзывов</option>
          </select>

          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            color: onlyDiscount ? '#ef4444' : 'var(--text-secondary)',
            background: onlyDiscount ? 'rgba(239, 68, 68, 0.12)' : 'var(--card-bg)',
            border: `1px solid ${onlyDiscount ? '#ef4444' : 'var(--border-color)'}`,
            padding: '8px 12px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={onlyDiscount}
              onChange={(e) => setOnlyDiscount(e.target.checked)}
              style={{ accentColor: '#ef4444', cursor: 'pointer' }}
            />
            <span>Только со скидкой</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Найдено: <strong style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>{filteredServices.length}</strong>
          </div>
        </div>

        {error && (
          <div className="server-error-banner">
            <h3>Ошибка: сервер backend недоступен</h3>
            <p>В каталоге нет товаров, потому что сервер API на порту 3001 не отвечает.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRetry}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {loading && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <p>Загрузка каталога услуг из базы данных PostgreSQL...</p>
          </div>
        )}

        {!loading && !error && filteredServices.length > 0 && (
          <div className="services-grid">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onAddToCart={onAddToCart}
                onOpenReviews={onOpenReviews}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        {!loading && !error && filteredServices.length === 0 && (
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>Услуг по заданным критериям не найдено.</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                onSelectCategory('all');
                onSearchChange('');
                setMinPrice('');
                setMaxPrice('');
              }}
            >
              Сбросить все фильтры
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
