import { useContext } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { StoreContext } from "./StoreContext";

function Layout() {
  const { cart, theme, toggleTheme } = useContext(StoreContext);

  return (
    <>
      <header className="header">
        <NavLink className="logo" to="/">
          Лавка
        </NavLink>

        <nav className="nav">
          <NavLink to="/" end>
            Каталог
          </NavLink>
          <NavLink to="/cart">Корзина ({cart.length})</NavLink>
          <NavLink to="/login">Вход</NavLink>
        </nav>

        <button type="button" onClick={toggleTheme}>
          {theme === "light" ? "Тёмная тема" : "Светлая тема"}
        </button>
      </header>

      <main className="main">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
