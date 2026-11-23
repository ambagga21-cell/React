// Компонент навигационной панели
export default function Navbar({
  user,
  cartCount,
  cartTotal,
  theme,
  onToggleTheme,
  onOpenAuth,
  onOpenProfile,
  onOpenAdmin,
  onOpenCart,
  onGoHome,
  onLogout
}) {
  return (
    <header className="header-wrapper">
      <div className="header-container">
        <div
          className="header-logo"
          onClick={() => {
            if (onGoHome) onGoHome();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{ cursor: 'pointer' }}
          title="На главную"
        >
          <h1>Салон-магазин «Лавка Услуг»</h1>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onToggleTheme}
            title="Переключить тему оформления"
          >
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                {user.role === 'admin' ? 'Администратор' : 'Клиент'}
              </span>

              <span style={{ fontSize: '13px', fontWeight: '500' }}>
                {user.name}
              </span>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onOpenProfile}
                title="Перейти в личный кабинет"
              >
                Личный кабинет
              </button>

              {user.role === 'admin' && (
                <button
                  type="button"
                  className="btn btn-warning btn-sm"
                  onClick={onOpenAdmin}
                  title="Панель администратора"
                >
                  Панель администратора
                </button>
              )}

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onLogout}
                title="Выйти из аккаунта"
                style={{ color: 'var(--danger-color)' }}
              >
                Выйти
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenAuth}
            >
              Войти в аккаунт
            </button>
          )}

          {user?.role !== 'admin' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenCart}
              title="Открыть корзину"
            >
              <span>Корзина</span>
              <span style={{
                background: '#ef4444',
                color: '#fff',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold',
                marginLeft: '4px'
              }}>
                {cartCount}
              </span>
              <span style={{ fontWeight: 'bold', marginLeft: '6px' }}>
                {typeof formatPrice === 'function' ? formatPrice(cartTotal) : `${cartTotal} ₽`}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
