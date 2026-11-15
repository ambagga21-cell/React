import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../StoreContext";
import {
  discountedPrice,
  formatDuration,
  formatPrice,
} from "../utils";

function Products() {
  const {
    services,
    categories,
    catalogLoading,
    catalogError,
    loadCatalog,
    cartCount,
    addToCart,
    user,
  } = useStore();
  const [selectedCategories, setSelectedCategories] = useState([]);

  function toggleCategory(id) {
    setSelectedCategories((current) =>
      current.includes(id)
        ? current.filter((categoryId) => categoryId !== id)
        : [...current, id],
    );
  }

  const visibleServices = useMemo(() => {
    if (selectedCategories.length === 0) {
      return services;
    }

    return services.filter((service) =>
      selectedCategories.includes(service.categoryId),
    );
  }, [services, selectedCategories]);

  return (
    <div className="catalog-layout">
      <aside className="sidebar" aria-label="Фильтр по категориям">
        <h2>Категории</h2>
        <p className="sidebar__hint">
          Отметьте одну или несколько категорий. Без выбора показаны все
          услуги.
        </p>

        <div className="sidebar__list">
          {categories.map((category) => (
            <label className="checkbox" key={category.id}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>

        {!catalogLoading && categories.length === 0 && (
          <p className="muted">Категорий пока нет.</p>
        )}
      </aside>

      <section className="catalog-content">
        <h1>Каталог услуг</h1>

        {user?.coupon && (
          <p className="coupon-note">
            Ваш купон «{user.coupon.name}» даёт персональную скидку{" "}
            {user.coupon.discountPercent}% на оформление.
          </p>
        )}

        {catalogLoading && (
          <p className="status" role="status">
            Загрузка услуг...
          </p>
        )}

        {catalogError && (
          <div className="status status--error" role="alert">
            <p>{catalogError}</p>
            <button type="button" onClick={loadCatalog}>
              Повторить загрузку
            </button>
          </div>
        )}

        {!catalogLoading && !catalogError && visibleServices.length === 0 && (
          <p className="muted">
            По выбранным категориям услуг не найдено.
          </p>
        )}

        <div className="grid">
          {visibleServices.map((service) => {
            const finalPrice = discountedPrice(
              service.price,
              service.discountPercent,
            );

            return (
              <article className="card service-card" key={service.id}>
                <div className="service-card__top">
                  <span className="badge">{service.categoryName}</span>
                  {service.discountPercent > 0 && (
                    <span className="badge badge--discount">
                      −{service.discountPercent}%
                    </span>
                  )}
                </div>

                <h2>{service.name}</h2>
                <p className="service-card__description">
                  {service.description}
                </p>
                <p className="service-card__duration">
                  Длительность: {formatDuration(service.durationMinutes)}
                </p>

                <p className="price">
                  {service.discountPercent > 0 && (
                    <s>{formatPrice(service.price)}</s>
                  )}{" "}
                  {formatPrice(finalPrice)}
                </p>

                <button type="button" onClick={() => addToCart(service)}>
                  В корзину
                </button>
              </article>
            );
          })}
        </div>

        {cartCount > 0 && (
          <Link className="to-cart" to="/cart">
            Перейти в корзину ({cartCount})
          </Link>
        )}
      </section>
    </div>
  );
}

export default Products;
