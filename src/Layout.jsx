import { NavLink, Outlet } from "react-router-dom";
import { useStore } from "./StoreContext";

function Layout() {
  const { cartCount, theme, toggleTheme, user, logout } = useStore();

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
          <NavLink to="/cart">Корзина ({cartCount})</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard">{user.name}</NavLink>
              <button type="button" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <NavLink to="/login">Вход</NavLink>
          )}
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
