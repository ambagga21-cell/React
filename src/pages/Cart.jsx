import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useStore } from "../StoreContext";
import { formatDuration, formatPrice } from "../utils";

function Cart() {
  const {
    cart,
    subtotal,
    serviceDiscount,
    couponDiscount,
    couponPercent,
    total,
    user,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useStore();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCheckout() {
    setCheckingOut(true);
    setError("");

    try {
      const data = await api.checkout(cart);
      clearCart();
      setSuccess(
        `Записи оформлены. Сумма к оплате: ${formatPrice(data.total)}.`,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCheckingOut(false);
    }
  }

  if (success) {
    return (
      <>
        <h1>Корзина</h1>
        <div className="status status--success" role="status">
          <p>{success}</p>
          <Link to="/dashboard">Перейти к записям</Link>
        </div>
        <p>
          <Link to="/">Вернуться в каталог</Link>
        </p>
      </>
    );
  }

  if (cart.length === 0) {
    return (
      <>
        <h1>Корзина</h1>
        <p>Корзина пуста.</p>
        <Link to="/">Вернуться в каталог</Link>
      </>
    );
  }

  return (
    <>
      <h1>Корзина</h1>

      <ul className="cart">
        {cart.map((item) => {
          const base = item.price * item.quantity;
          const itemServiceDiscount = Math.round(
            (base * (item.discountPercent || 0)) / 100,
          );
          const afterServiceDiscount = base - itemServiceDiscount;
          const itemCouponDiscount = Math.round(
            (afterServiceDiscount * couponPercent) / 100,
          );
          const itemTotal = afterServiceDiscount - itemCouponDiscount;

          return (
            <li key={item.id}>
              <div className="cart__info">
                <span className="cart__name">{item.name}</span>
                <span className="cart__meta">
                  {item.categoryName} · {formatDuration(item.durationMinutes)}
                </span>
              </div>

              <div className="qty-controls">
                <button
                  type="button"
                  aria-label="Уменьшить количество"
                  onClick={() => decreaseQuantity(item.id)}
                  disabled={item.quantity === 1}
                >
                  −
                </button>
                <span className="qty">{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Увеличить количество"
                  onClick={() => increaseQuantity(item.id)}
                >
                  +
                </button>
              </div>

              <span className="cart__sum">
                {itemServiceDiscount > 0 && (
                  <s>{formatPrice(base)}</s>
                )}{" "}
                {formatPrice(itemTotal)}
              </span>

              <button
                type="button"
                className="cart__remove"
                onClick={() => removeFromCart(item.id)}
              >
                Удалить
              </button>
            </li>
          );
        })}
      </ul>

      <div className="cart-summary">
        <ul className="summary">
          <li>
            <span>Стоимость услуг</span>
            <span>{formatPrice(subtotal)}</span>
          </li>
          {serviceDiscount > 0 && (
            <li className="summary__discount">
              <span>Скидки на услуги</span>
              <span>−{formatPrice(serviceDiscount)}</span>
            </li>
          )}
          {couponDiscount > 0 && (
            <li className="summary__discount">
              <span>
                Купон «{user?.coupon?.name}» ({couponPercent}%)
              </span>
              <span>−{formatPrice(couponDiscount)}</span>
            </li>
          )}
          <li className="summary__total">
            <span>Итого</span>
            <span>{formatPrice(total)}</span>
          </li>
        </ul>

        {error && (
          <p className="status status--error" role="alert">
            {error}
          </p>
        )}

        {user ? (
          <button
            type="button"
            className="checkout"
            onClick={handleCheckout}
            disabled={checkingOut}
          >
            {checkingOut ? "Оформление..." : "Оформить записи"}
          </button>
        ) : (
          <p className="status">
            Чтобы оформить записи, <Link to="/login">войдите в аккаунт</Link>.
          </p>
        )}
      </div>
    </>
  );
}

export default Cart;
