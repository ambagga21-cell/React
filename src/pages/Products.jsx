import { useContext } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../StoreContext";
import products from "../products";

function Products() {
  const { cart, addToCart } = useContext(StoreContext);

  return (
    <>
      <h1>Каталог товаров</h1>

      <div className="grid">
        {products.map((product) => (
          <article className="card" key={product.id}>
            <img src={product.image} alt={product.name} />
            <h2>{product.name}</h2>
            <p className="price">
              {product.price.toLocaleString("ru-RU")} ₽
            </p>
            <button type="button" onClick={() => addToCart(product)}>
              В корзину
            </button>
          </article>
        ))}
      </div>

      {cart.length > 0 && (
        <Link className="to-cart" to="/cart">
          Перейти в корзину
        </Link>
      )}
    </>
  );
}

export default Products;
