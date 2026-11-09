import { useContext } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../StoreContext";

function Cart() {
  const { cart, total, removeFromCart } = useContext(StoreContext);

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
        {cart.map((item, index) => (
          <li key={index}>
            <span>{item.name}</span>
            <span>{item.price.toLocaleString("ru-RU")} ₽</span>
            <button type="button" onClick={() => removeFromCart(index)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>

      <p className="total">Итого: {total.toLocaleString("ru-RU")} ₽</p>
    </>
  );
}

export default Cart;
