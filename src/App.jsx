import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Catalog from './components/Catalog';
import CartModal from './components/CartModal';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ProfileModal from './components/ProfileModal';
import ReviewsModal from './components/ReviewsModal';
import AdminPanel from './components/AdminPanel';

import { getMe } from './api/auth';
import { getServices } from './api/services';
import { getCategories } from './api/categories';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from './api/cart';

// Главный функциональный компонент React-приложения
export default function App() {
  // Состояние пользователя
  const [user, setUser] = useState(null);

  // Состояние каталога услуг
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояние серверной корзины
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Маршрутизация на основе HTML5 History API (Browser Router)
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname || '/';
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [reviewsService, setReviewsService] = useState(null);

  const navigate = useCallback((path, replace = false) => {
    if (window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState({}, '', path);
      } else {
        window.history.pushState({}, '', path);
      }
    }
    setCurrentPath(path);
  }, []);

  // Синхронизация с кнопками браузера Вперед / Назад
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Тема оформления (светлая/тёмная)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Применение темы к HTML документу
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Загрузка текущего авторизованного пользователя
  const loadCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setAuthChecked(true);
      return;
    }
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (e) {
      console.warn('Токен недействителен, сброс сессии:', e.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  // Валидация и защита маршрутов
  useEffect(() => {
    if (!authChecked) return;

    if (currentPath === '/admin') {
      if (!user) {
        navigate('/login', true);
      } else if (user.role !== 'admin') {
        navigate('/', true);
      }
    } else if (currentPath === '/profile') {
      if (!user) {
        navigate('/login', true);
      }
    } else if (currentPath === '/cart' || currentPath === '/checkout') {
      if (user && user.role === 'admin') {
        navigate('/', true);
      }
    }
  }, [currentPath, user, authChecked, navigate]);

  // Загрузка корзины из базы данных
  const loadUserCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
      return;
    }
    try {
      const data = await getCart();
      setCartItems(data.items || []);
      setCartTotal(Number(data.total_amount) || 0);
      setCartCount(Number(data.total_count) || 0);
    } catch (e) {
      console.error('Ошибка при загрузке корзины:', e);
    }
  }, []);

  // Загрузка каталога услуг через API с JOIN-запросами
  const loadServicesList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getServices({
        category: selectedCategory,
        search: searchTerm,
        sort: sortOption
      });
      const list = Array.isArray(data)
        ? data
        : (data && Array.isArray(data.services) ? data.services : []);
      setServices(list);
    } catch (err) {
      setError(err.message || 'Ошибка подключения к серверу API');
      console.error('Ошибка загрузки каталога:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, sortOption]);

  // Загрузка списка категорий
  const loadCategoriesList = async () => {
    try {
      const data = await getCategories();
      const list = Array.isArray(data)
        ? data
        : (data && Array.isArray(data.categories) ? data.categories : []);
      setCategories(list);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

  // Инициализация при монтировании компонента
  useEffect(() => {
    loadCurrentUser();
    loadCategoriesList();
    loadServicesList();
  }, [loadServicesList]);

  // Загрузка корзины при изменении пользователя
  useEffect(() => {
    loadUserCart();
  }, [user, loadUserCart]);

  // Добавление услуги в корзину (с проверкой лимитов сеанса мастера: Вариант А)
  const handleAddToCart = async (service) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // 1. Проверка на лимит одинаковых услуг (максимум 3 на один визит мастера)
    const existing = cartItems.find((i) => i.service_id === service.id);
    if (existing && existing.quantity >= 3) {
      alert(`Один мастер не может выполнить процедуру "${service.name}" более 3 раз за один визит. Для дополнительных процедур оформите отдельную запись.`);
      return;
    }

    // 2. Проверка на суммарную длительность визита мастера (максимум 360 минут = 6 часов)
    const currentDuration = cartItems.reduce(
      (sum, item) => sum + ((Number(item.duration) || 60) * item.quantity),
      0
    );
    const serviceDuration = Number(service.duration || service.duration_minutes || 60);

    if (currentDuration + serviceDuration > 360) {
      const curH = Math.floor(currentDuration / 60);
      const curM = currentDuration % 60;
      alert(`Превышен лимит рабочего времени мастера на один визит (максимум 6 часов).\nСейчас в корзине: ${curH > 0 ? `${curH} ч ` : ''}${curM} мин.\nУслуга "${service.name}" длится ${serviceDuration} мин. Оформите отдельную запись.`);
      return;
    }

    try {
      await addToCart(service.id, 1);
      await loadUserCart();
    } catch (e) {
      alert(e.message || 'Не удалось добавить в корзину');
    }
  };

  // Изменение количества в корзине (с валидацией лимитов мастера)
  const handleUpdateCartQty = async (serviceId, newQty) => {
    if (newQty > 3) {
      alert('Один мастер не может выполнить более 3 одинаковых процедур за один визит.');
      return;
    }

    const item = cartItems.find((i) => i.service_id === serviceId);
    if (item && newQty > item.quantity) {
      const currentDuration = cartItems.reduce(
        (sum, i) => sum + ((Number(i.duration) || 60) * i.quantity),
        0
      );
      const diff = (newQty - item.quantity) * (Number(item.duration) || 60);
      if (currentDuration + diff > 360) {
        alert('Превышен допустимый лимит времени мастера на один визит (максимум 6 часов).');
        return;
      }
    }

    try {
      await updateCartItem(serviceId, newQty);
      await loadUserCart();
    } catch (e) {
      alert(e.message);
    }
  };

  // Удаление позиции из корзины
  const handleRemoveCartItem = async (serviceId) => {
    try {
      await removeCartItem(serviceId);
      await loadUserCart();
    } catch (e) {
      alert(e.message);
    }
  };

  // Очистка корзины
  const handleClearCart = async () => {
    if (!window.confirm('Очистить корзину?')) return;
    try {
      await clearCart();
      await loadUserCart();
    } catch (e) {
      alert(e.message);
    }
  };

  // Выход из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCartItems([]);
    setCartTotal(0);
    setCartCount(0);
    navigate('/');
  };

  // Успешная авторизация
  const handleAuthSuccess = (userData) => {
    setUser(userData);
    loadUserCart();
    loadServicesList();
    navigate('/');
  };

  // Успешное оформление заказа
  const handleOrderSuccess = async () => {
    await loadUserCart();
    navigate('/profile');
  };

  return (
    <div className="app-root">
      {/* Навигационная панель */}
      <Navbar
        user={user}
        cartCount={cartCount}
        cartTotal={cartTotal}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => navigate('/login')}
        onOpenProfile={() => navigate('/profile')}
        onOpenAdmin={() => navigate('/admin')}
        onOpenCart={() => navigate('/cart')}
        onGoHome={() => navigate('/')}
        onLogout={handleLogout}
      />

      {/* Информационный баннер */}
      <div className="main-container">
        <div className="banner-info">
          <div>
            <strong>Специальное предложение:</strong> на услуги действует сезонная скидка до 30%!
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Быстрая запись и выезд мастера на дом
          </div>
        </div>

        {/* Каталог услуг */}
        <Catalog
          services={services}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortOption={sortOption}
          onSortChange={setSortOption}
          loading={loading}
          error={error}
          onRetry={loadServicesList}
          onAddToCart={handleAddToCart}
          onOpenReviews={(s) => setReviewsService(s)}
          isAdmin={user?.role === 'admin'}
        />
      </div>

      {/* Подвал сайта */}
      <footer>
        <p>Информационная система онлайн-заказа услуг и товаров «Лавка Услуг» © 2026</p>
        <p style={{ fontSize: '12px', marginTop: '4px' }}>Курсовой проект по React и серверным API. PostgreSQL 18 & Express.</p>
      </footer>

      {/* Модальное окно авторизации и регистрации */}
      <AuthModal
        isOpen={currentPath === '/login' || currentPath === '/auth'}
        onClose={() => navigate('/')}
        onAuthSuccess={handleAuthSuccess}
        onOpenForgotPassword={() => navigate('/forgot-password')}
      />

      {/* Модальное окно восстановления пароля */}
      <ForgotPasswordModal
        isOpen={currentPath === '/forgot-password' || currentPath === '/forgot'}
        onClose={() => navigate('/')}
        onOpenAuth={() => navigate('/login')}
      />

      {/* Модальное окно корзины - доступно только клиентам, скрыто для администратора */}
      {user?.role !== 'admin' && (
        <CartModal
          isOpen={currentPath === '/cart'}
          onClose={() => navigate('/')}
          cartItems={cartItems}
          cartTotal={cartTotal}
          cartCount={cartCount}
          user={user}
          onUpdateQty={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onOpenCheckout={() => navigate('/checkout')}
          onOpenAuth={() => navigate('/login')}
        />
      )}

      {/* Модальное окно оформления заказа - только для клиентов */}
      {user?.role !== 'admin' && (
        <CheckoutModal
          isOpen={currentPath === '/checkout'}
          onClose={() => navigate('/cart')}
          cartItems={cartItems}
          cartTotal={cartTotal}
          user={user}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Модальное окно отзывов */}
      <ReviewsModal
        service={reviewsService}
        user={user}
        isOpen={Boolean(reviewsService)}
        onClose={() => setReviewsService(null)}
        onOpenAuth={() => navigate('/login')}
        onReviewAdded={loadServicesList}
      />

      {/* Модальное окно личного кабинета */}
      <ProfileModal
        isOpen={currentPath === '/profile'}
        onClose={() => navigate('/')}
        user={user}
        onProfileUpdated={(updated) => setUser(updated)}
      />

      {/* Панель администратора */}
      <AdminPanel
        isOpen={currentPath === '/admin' && user?.role === 'admin'}
        onClose={() => navigate('/')}
        services={services}
        categories={categories}
        onServicesChanged={loadServicesList}
        onCategoriesChanged={() => { loadCategoriesList(); loadServicesList(); }}
        currentUser={user}
      />
    </div>
  );
}
