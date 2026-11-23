import { useState, useEffect } from 'react';
import { getAdminStats, getAdminOrders, updateOrderStatus, deleteOrder, getAdminUsers, updateUserRole, deleteUser, getAdminReviews, deleteReview } from '../api/admin';
import { createService, updateService, deleteService } from '../api/services';
import { createCategory, updateCategory, deleteCategory } from '../api/categories';
import { formatDuration, formatPrice, calculateFinalPrice } from '../utils/formatters';
import { formatPhoneNumber } from '../api/auth';

// Полнофункциональная панель администратора для управления всеми ресурсами ИС
export default function AdminPanel({
  isOpen,
  onClose,
  services,
  categories,
  onServicesChanged,
  onCategoriesChanged,
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'services' | 'categories' | 'reviews' | 'users'
  const [stats, setStats] = useState(null);

  // Списки данных
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [panelError, setPanelError] = useState(null);
  const [panelSuccess, setPanelSuccess] = useState(null);
  const [serviceModalError, setServiceModalError] = useState(null);

  // Поиск по каждой вкладке админ-панели
  const [orderSearch, setOrderSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Модалка добавления/редактирования услуги (длительность в часах и минутах + скидка + склад)
  const [editingService, setEditingService] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [sName, setSName] = useState('');
  const [sCat, setSCat] = useState('');
  const [sPrice, setSPrice] = useState('');
  const [sStock, setSStock] = useState(10);
  const [sHours, setSHours] = useState(1);
  const [sMinutes, setSMinutes] = useState(0);
  const [sDiscount, setSDiscount] = useState(0);
  const [sDesc, setSDesc] = useState('');
  const [sImg, setSImg] = useState('');
  const [sNewCatName, setSNewCatName] = useState('');

  // Редактирование существующей категории
  const [editingCat, setEditingCat] = useState(null);
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [catModalError, setCatModalError] = useState(null);

  // Поиск и фильтрация отзывов в панели админа
  const [revSearch, setRevSearch] = useState('');
  const [revRating, setRevRating] = useState('all');

  // Форма добавления новой категории
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Загружаем статистику и все списки параллельно при открытии панели,
  // чтобы счётчики во всех вкладках сразу показывали реальные числа
  const loadAllData = async () => {
    setLoading(true);
    setPanelError(null);
    try {
      await Promise.all([
        loadStats(),
        loadOrders(),
        loadUsers(),
        loadReviews()
      ]);
    } catch (e) {
      console.warn('Ошибка загрузки данных админ-панели:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (e) {
      console.warn('Stats error:', e.message);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await getAdminOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Orders load error:', e);
      setPanelError(e.message || 'Ошибка получения списка заказов');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Users load error:', e);
      setPanelError(e.message || 'Ошибка получения списка пользователей');
    }
  };

  const loadReviews = async () => {
    try {
      const data = await getAdminReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Reviews load error:', e);
      setPanelError(e.message || 'Ошибка получения отзывов');
    }
  };

  // Смена статуса заказа (с запретом изменения завершенных заказов)
  const handleStatusChange = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder && (targetOrder.status === 'Выполнен' || targetOrder.status === 'Отменен')) {
      setPanelError(`Заказ №${orderId} уже имеет статус "${targetOrder.status}". Изменять выполненные или отмененные заказы запрещено.`);
      return;
    }

    try {
      setPanelError(null);
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
      await loadStats();
      setPanelSuccess(`Статус заказа №${orderId} изменен на "${newStatus}"`);
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка смены статуса заказа');
    }
  };

  // Удаление заказа
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Вы действительно хотите удалить этот заказ?')) return;
    try {
      setPanelError(null);
      await deleteOrder(orderId);
      await loadOrders();
      await loadStats();
      setPanelSuccess('Заказ успешно удален');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления заказа');
    }
  };

  // Смена роли пользователя
  const handleRoleChange = async (userId, newRole) => {
    try {
      setPanelError(null);
      await updateUserRole(userId, newRole);
      await loadUsers();
      setPanelSuccess('Роль пользователя успешно обновлена');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка изменения роли');
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Удалить пользователя из системы?')) return;
    try {
      setPanelError(null);
      await deleteUser(userId);
      await loadUsers();
      await loadStats();
      setPanelSuccess('Пользователь успешно удален');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления пользователя');
    }
  };

  // Удаление отзыва
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Удалить отзыв?')) return;
    try {
      setPanelError(null);
      await deleteReview(reviewId);
      await loadReviews();
      if (onServicesChanged) onServicesChanged();
      setPanelSuccess('Отзыв успешно удален');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления отзыва');
    }
  };

  // Открытие формы добавления новой услуги
  const handleOpenAddService = () => {
    setEditingService(null);
    setSName('');
    const firstCat = categories.find(c => c.name !== 'Без категории');
    setSCat(firstCat ? firstCat.name : (categories.length > 0 ? categories[0].name : 'Без категории'));
    setSNewCatName('');
    setSPrice('');
    setSStock(10);
    setSHours(1);
    setSMinutes(0);
    setSDiscount(0);
    setSDesc('');
    setSImg('/images/services/styling.jpg');
    setServiceModalError(null);
    setIsServiceModalOpen(true);
  };

  // Открытие формы редактирования услуги
  const handleOpenEditService = (s) => {
    setEditingService(s);
    setSName(s.name);
    setSCat(s.category_name || 'Без категории');
    setSNewCatName('');
    setSPrice(s.price);
    setSStock(s.stock !== undefined ? s.stock : 10);
    const totalMins = Number(s.duration || s.duration_minutes || 60);
    setSHours(Math.floor(totalMins / 60));
    setSMinutes(totalMins % 60);
    setSDiscount(Number(s.discount_percent || 0));
    setSDesc(s.description || '');
    setSImg(s.image_url || '/images/services/styling.jpg');
    setServiceModalError(null);
    setIsServiceModalOpen(true);
  };

  // Сохранение услуги
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!sName || !sPrice) {
      setServiceModalError('Заполните обязательные поля (название и цена)');
      return;
    }

    if (Number(sPrice) <= 0) {
      setServiceModalError('Цена услуги должна быть строго больше 0 ₽');
      return;
    }

    const calculatedDuration = (parseInt(sHours, 10) || 0) * 60 + (parseInt(sMinutes, 10) || 0);
    if (calculatedDuration <= 0) {
      setServiceModalError('Длительность услуги должна быть больше 0 минут');
      return;
    }
    if (calculatedDuration > 360) {
      setServiceModalError('Длительность услуги не может превышать 6 часов (360 минут) — максимальная рабочая смена мастера');
      return;
    }

    // Валидация скидки от 0 до 99
    const discountVal = sDiscount === '' ? 0 : Number(sDiscount);
    if (isNaN(discountVal) || !Number.isInteger(discountVal)) {
      setServiceModalError('Скидка должна быть целым числом в диапазоне от 0 до 99%');
      return;
    }
    if (discountVal < 0) {
      setServiceModalError('Ошибка: скидка не может быть меньше 0%');
      return;
    }
    if (discountVal >= 100) {
      setServiceModalError('Ошибка: скидка не может быть 100% или больше (максимум 99%)');
      return;
    }

    // Валидация остатка на складе
    const stockVal = sStock === '' ? 10 : parseInt(sStock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      setServiceModalError('Количество на складе должно быть целым неотрицательным числом');
      return;
    }

    let finalCategoryName = sCat;
    if (sCat === '__new__') {
      if (!sNewCatName || !sNewCatName.trim()) {
        setServiceModalError('Введите название новой категории');
        return;
      }
      finalCategoryName = sNewCatName.trim();
    }

    try {
      setServiceModalError(null);
      const payload = {
        name: sName.trim(),
        category_name: finalCategoryName,
        price: Number(sPrice),
        stock: stockVal,
        duration: calculatedDuration,
        discount_percent: discountVal,
        description: sDesc.trim(),
        image_url: sImg.trim() || '/images/services/styling.jpg'
      };

      if (editingService) {
        await updateService(editingService.id, payload);
        setPanelSuccess('Услуга успешно обновлена');
      } else {
        await createService(payload);
        setPanelSuccess('Новая услуга успешно создана');
      }

      setIsServiceModalOpen(false);
      if (onServicesChanged) onServicesChanged();
      if (onCategoriesChanged) onCategoriesChanged();
      await loadStats();
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (err) {
      setServiceModalError(err.message || 'Ошибка сохранения услуги');
    }
  };

  // Удаление услуги
  const handleDeleteService = async (id) => {
    if (!window.confirm('Вы действительно хотите удалить эту услугу?')) return;
    try {
      setPanelError(null);
      await deleteService(id);
      if (onServicesChanged) onServicesChanged();
      await loadStats();
      setPanelSuccess('Услуга успешно удалена');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления услуги');
    }
  };

  // Редактирование существующей категории
  const handleOpenEditCategory = (cat) => {
    if (cat.name === 'Без категории') {
      setPanelError('Системную категорию «Без категории» нельзя редактировать или переименовывать');
      return;
    }
    setEditingCat(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setCatModalError(null);
    setIsEditCatModalOpen(true);
  };

  const handleSaveEditCategory = async (e) => {
    e.preventDefault();
    if (!editCatName.trim()) {
      setCatModalError('Название категории обязательно');
      return;
    }
    try {
      setCatModalError(null);
      await updateCategory(editingCat.id, {
        name: editCatName.trim(),
        description: editCatDesc.trim()
      });
      setIsEditCatModalOpen(false);
      setEditingCat(null);
      if (onCategoriesChanged) onCategoriesChanged();
      if (onServicesChanged) onServicesChanged();
      setPanelSuccess('Категория успешно обновлена');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setCatModalError(e.message || 'Ошибка обновления категории');
    }
  };

  // Добавление новой категории
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      setPanelError(null);
      await createCategory({ name: catName.trim(), description: catDesc.trim() });
      setCatName('');
      setCatDesc('');
      if (onCategoriesChanged) onCategoriesChanged();
      setPanelSuccess('Категория успешно добавлена');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка добавления категории');
    }
  };

  // Удаление категории
  const handleDeleteCategory = async (id, catName) => {
    if (catName === 'Без категории') {
      setPanelError('Системную категорию «Без категории» нельзя удалить, она должна присутствовать всегда');
      return;
    }
    if (!window.confirm('Удалить категорию? Услуги из этой категории будут сохранены и автоматически перенесены в категорию «Без категории».')) return;
    try {
      setPanelError(null);
      await deleteCategory(id);
      if (onCategoriesChanged) onCategoriesChanged();
      if (onServicesChanged) onServicesChanged();
      setPanelSuccess('Категория удалена. Все товары автоматически перенесены в раздел «Без категории»');
      setTimeout(() => setPanelSuccess(null), 3000);
    } catch (e) {
      setPanelError(e.message || 'Ошибка удаления категории');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '980px' }}>
        <div className="modal-header">
          <div>
            <h3>Панель управления администратора</h3>
            {stats && (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Заказов: <strong>{stats.total_orders}</strong> | Выручка: <strong>{Number(stats.total_revenue).toLocaleString('ru-RU')} ₽</strong> | Клиентов: <strong>{stats.total_users}</strong>
              </span>
            )}
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Закрыть панель">✕</button>
        </div>

        <div className="modal-body">
          {/* Навигация панели админа */}
          <div className="tabs-nav">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Заказы клиентов ({orders.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              Услуги ({services.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Категории ({categories.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Отзывы ({reviews.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Пользователи ({users.length})
            </button>
          </div>

          {/* Информационные плашки об ошибках и успехе (без всплывающих alert) */}
          {panelError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--danger-color)',
              color: 'var(--danger-color)',
              padding: '10px 14px',
              borderRadius: '8px',
              margin: '12px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px'
            }}>
              <span>⚠️ {panelError}</span>
              <button
                type="button"
                onClick={() => setPanelError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger-color)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginLeft: '12px'
                }}
              >
                ✕
              </button>
            </div>
          )}

          {panelSuccess && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid #22c55e',
              color: '#22c55e',
              padding: '10px 14px',
              borderRadius: '8px',
              margin: '12px 0',
              fontSize: '13px'
            }}>
              ✓ {panelSuccess}
            </div>
          )}

          {/* Вкладка 1: Заказы (с отображением x2, x3 для повторяющихся услуг) */}
          {activeTab === 'orders' && (() => {
            const filteredOrders = orders.filter((o) => {
              if (!orderSearch.trim()) return true;
              const q = orderSearch.trim().toLowerCase();
              return (
                String(o.id).includes(q) ||
                (o.user_name || '').toLowerCase().includes(q) ||
                (o.user_email || '').toLowerCase().includes(q) ||
                (o.user_phone || '').toLowerCase().includes(q) ||
                (o.delivery_address || '').toLowerCase().includes(q) ||
                (o.status || '').toLowerCase().includes(q) ||
                (o.coupon_code || '').toLowerCase().includes(q) ||
                (o.items_summary || '').toLowerCase().includes(q)
              );
            });

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px' }}>Список поступивших заказов ({orders.length})</h4>
                  <button type="button" className="btn btn-outline btn-sm" onClick={loadOrders}>
                    Обновить список
                  </button>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Поиск заказов по клиенту, email, телефону, адресу, статусу или купону..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{ fontSize: '13px', padding: '6px 10px' }}
                  />
                </div>

                {loading ? (
                  <p style={{ textAlign: 'center', padding: '20px' }}>Загрузка заказов...</p>
                ) : filteredOrders.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    {orderSearch ? 'Ничего не найдено по запросу поиска' : 'Заказов пока нет'}
                  </p>
                ) : (
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>№</th>
                          <th>Клиент</th>
                          <th>Телефон</th>
                          <th>Адрес доставки</th>
                          <th>Дата доставки</th>
                          <th>Услуги (с количеством x2, x3)</th>
                          <th>Сумма</th>
                          <th>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((o, idx) => (
                          <tr key={o.id}>
                            <td><strong>№ {idx + 1}</strong></td>
                            <td>
                              <strong>{o.user_name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{o.user_email}</div>
                            </td>
                            <td>{formatPhoneNumber(o.user_phone) || o.user_phone || '—'}</td>
                            <td>{o.delivery_address}</td>
                            <td>{new Date(o.delivery_date).toLocaleDateString('ru-RU')}</td>
                            <td>
                              {/* Отображение услуг с группировкой x2, x3 */}
                              <span style={{ fontSize: '13px', color: 'var(--accent-color)', fontWeight: '500' }}>
                                {o.items_summary}
                              </span>
                              {o.coupon_code && (
                                <div style={{
                                  display: 'inline-block',
                                  marginTop: '4px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(34, 197, 94, 0.15)',
                                  color: '#16a34a',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  🎟 Купон: {o.coupon_code} (-{Number(o.discount_amount).toLocaleString('ru-RU')} ₽)
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                              {Number(o.total_price).toLocaleString('ru-RU')} ₽
                            </td>
                            <td>
                              {o.status === 'Выполнен' ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: 'rgba(34, 197, 94, 0.15)',
                                  color: '#22c55e',
                                  fontWeight: '600',
                                  fontSize: '12px'
                                }} title="Заказ выполнен (редактирование заблокировано)">
                                  ✓ Выполнен
                                </span>
                              ) : o.status === 'Отменен' ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: 'var(--danger-color)',
                                  fontWeight: '600',
                                  fontSize: '12px'
                                }} title="Заказ отменен (редактирование заблокировано)">
                                  ✕ Отменен
                                </span>
                              ) : (
                                <select
                                  value={o.status}
                                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                  style={{
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px'
                                  }}
                                >
                                  <option value="Принят">Принят</option>
                                  <option value="В обработке">В обработке</option>
                                  <option value="Выполнен">Выполнен</option>
                                  <option value="Отменен">Отменен</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Вкладка 2: Управление услугами */}
          {activeTab === 'services' && (() => {
            const filteredServices = services.filter((s) => {
              if (!serviceSearch.trim()) return true;
              const q = serviceSearch.trim().toLowerCase();
              return (
                (s.name || '').toLowerCase().includes(q) ||
                (s.category_name || '').toLowerCase().includes(q) ||
                (s.description || '').toLowerCase().includes(q)
              );
            });

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '15px' }}>Управление каталогом услуг ({services.length})</h4>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAddService}>
                    + Добавить новую услугу
                  </button>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Поиск услуг по названию, категории или описанию..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    style={{ fontSize: '13px', padding: '6px 10px' }}
                  />
                </div>

                {filteredServices.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    {serviceSearch ? 'Услуг по запросу поиска не найдено' : 'Каталог услуг пуст'}
                  </p>
                ) : (
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>№</th>
                          <th>Фото</th>
                          <th>Название услуги</th>
                          <th>Категория</th>
                          <th>Склад</th>
                          <th>Длительность</th>
                          <th>Цена</th>
                          <th>Скидка</th>
                          <th>Рейтинг</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredServices.map((s, idx) => {
                          const discount = Number(s.discount_percent || 0);
                          const origPrice = Number(s.price || 0);
                          const finalPrice = discount > 0
                            ? Number(s.final_price !== undefined ? s.final_price : calculateFinalPrice(origPrice, discount))
                            : origPrice;

                          return (
                            <tr key={s.id}>
                              <td>№ {idx + 1}</td>
                              <td>
                                <img
                                  src={s.image_url || '/images/services/styling.jpg'}
                                  alt=""
                                  style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                />
                              </td>
                              <td><strong>{s.name}</strong></td>
                              <td>{s.category_name || 'Без категории'}</td>
                              <td>
                                <span style={{
                                  fontWeight: '600',
                                  color: (s.stock !== undefined ? s.stock : 10) > 0 ? 'var(--text-primary)' : 'var(--danger-color)'
                                }}>
                                  {s.stock !== undefined ? `${s.stock} шт.` : '10 шт.'}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontWeight: '500' }}>
                                  {formatDuration(s.duration)}
                                </span>
                              </td>
                              <td>
                                {discount > 0 ? (
                                  <div>
                                    <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '11px', display: 'block' }}>
                                      {formatPrice(origPrice)}
                                    </span>
                                    <strong style={{ color: '#ef4444' }}>
                                      {formatPrice(finalPrice)}
                                    </strong>
                                  </div>
                                ) : (
                                  <strong style={{ fontWeight: 'bold' }}>
                                    {formatPrice(origPrice)}
                                  </strong>
                                )}
                              </td>
                              <td>
                                {discount > 0 ? (
                                  <span className="badge-discount">
                                    -{discount}%
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>—</span>
                                )}
                              </td>
                              <td>{Number(s.average_rating) > 0 ? Number(s.average_rating).toFixed(1) : '—'}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleOpenEditService(s)}
                                  >
                                    Ред.
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    style={{ color: 'var(--danger-color)' }}
                                    onClick={() => handleDeleteService(s.id)}
                                  >
                                    Удал.
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Вкладка 3: Категории */}
          {activeTab === 'categories' && (() => {
            const filteredCategories = categories.filter((c) => {
              if (!catSearch.trim()) return true;
              const q = catSearch.trim().toLowerCase();
              return (
                (c.name || '').toLowerCase().includes(q) ||
                (c.description || '').toLowerCase().includes(q)
              );
            });

            return (
              <div>
                <div style={{ marginBottom: '14px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Поиск категорий по названию или описанию..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    style={{ fontSize: '13px', padding: '6px 10px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                  {/* Список существующих категорий */}
                  <div>
                    <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>
                      Существующие категории ({categories.length})
                    </h4>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Название категории</th>
                          <th>Услуг</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCategories.map((c) => (
                          <tr key={c.id || c.name}>
                            <td>
                              <strong>{c.name}</strong>
                              {c.description && (
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {c.description}
                                </div>
                              )}
                            </td>
                            <td>{c.services_count || 0}</td>
                            <td>
                              {c.name === 'Без категории' ? (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Системная
                                </span>
                              ) : (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleOpenEditCategory(c)}
                                    title="Редактировать категорию"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    style={{ color: 'var(--danger-color)' }}
                                    onClick={() => handleDeleteCategory(c.id, c.name)}
                                    title="Удалить категорию (товары перейдут в «Без категории»)"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Форма добавления новой категории */}
                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
                    <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Добавить категорию</h4>
                    <form onSubmit={handleAddCategory}>
                      <div className="form-group">
                        <label>Название категории:</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Например: Спа-процедуры"
                          value={catName}
                          onChange={(e) => setCatName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Описание (необязательно):</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Краткое описание категории..."
                          value={catDesc}
                          onChange={(e) => setCatDesc(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                        + Создать категорию
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Вкладка 4: Модерация отзывов */}
          {activeTab === 'reviews' && (() => {
            const filteredReviews = reviews.filter((r) => {
              if (revRating !== 'all' && Number(r.rating) !== Number(revRating)) {
                return false;
              }
              if (revSearch && revSearch.trim()) {
                const q = revSearch.trim().toLowerCase();
                const matchService = (r.service_name || '').toLowerCase().includes(q);
                const matchAuthor = (r.author_name || '').toLowerCase().includes(q);
                const matchComment = (r.comment || '').toLowerCase().includes(q);
                if (!matchService && !matchAuthor && !matchComment) return false;
              }
              return true;
            });

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px' }}>
                    Модерация отзывов клиентов ({reviews.length})
                  </h4>
                  <button type="button" className="btn btn-outline btn-sm" onClick={loadReviews}>
                    Обновить
                  </button>
                </div>

                {/* Поиск и фильтрация отзывов по оценкам */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginBottom: '14px',
                  background: 'rgba(0,0,0,0.02)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Поиск по услуге, автору или тексту отзыва..."
                      value={revSearch}
                      onChange={(e) => setRevSearch(e.target.value)}
                      style={{ fontSize: '13px', padding: '6px 10px' }}
                    />
                  </div>

                  {/* Быстрые фильтры по оценкам (звездам) */}
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Оценка:</span>
                    {['all', '5', '4', '3', '2', '1'].map((rate) => {
                      const count = rate === 'all'
                        ? reviews.length
                        : reviews.filter(r => Number(r.rating) === Number(rate)).length;
                      return (
                        <button
                          key={rate}
                          type="button"
                          className={`btn btn-sm ${revRating === rate ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setRevRating(rate)}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <span>{rate === 'all' ? 'Все' : `${rate} ★`}</span>
                          <span style={{ opacity: 0.75 }}>({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  {(revSearch || revRating !== 'all') && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => { setRevSearch(''); setRevRating('all'); }}
                      style={{ fontSize: '12px', color: 'var(--accent-color)', padding: '4px 6px' }}
                    >
                      Сбросить
                    </button>
                  )}
                </div>

                {loading ? (
                  <p style={{ textAlign: 'center', padding: '20px' }}>Загрузка отзывов...</p>
                ) : reviews.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Отзывов пока нет</p>
                ) : filteredReviews.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    Отзывов по выбранным параметрам не найдено
                  </p>
                ) : (
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>№</th>
                          <th>Услуга</th>
                          <th>Автор</th>
                          <th>Оценка</th>
                          <th>Комментарий</th>
                          <th>Дата</th>
                          <th>Действие</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReviews.map((r, idx) => (
                          <tr key={r.id}>
                            <td>№ {idx + 1}</td>
                            <td><strong>{r.service_name}</strong></td>
                            <td>{r.author_name}</td>
                            <td>
                              <span style={{
                                fontWeight: 'bold',
                                color: r.rating >= 4 ? '#22c55e' : r.rating === 3 ? '#eab308' : '#ef4444'
                              }}>
                                {r.rating} из 5
                              </span>
                            </td>
                            <td style={{ maxWidth: '240px', fontSize: '13px' }}>{r.comment}</td>
                            <td>{new Date(r.created_at).toLocaleDateString('ru-RU')}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ color: 'var(--danger-color)' }}
                                onClick={() => handleDeleteReview(r.id)}
                              >
                                Удалить
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Вкладка 5: Пользователи */}
          {activeTab === 'users' && (() => {
            const filteredUsers = users.filter((u) => {
              if (!userSearch.trim()) return true;
              const q = userSearch.trim().toLowerCase();
              return (
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q) ||
                (u.role || '').toLowerCase().includes(q)
              );
            });

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px' }}>Управление пользователями и ролями ({users.length})</h4>
                  <button type="button" className="btn btn-outline btn-sm" onClick={loadUsers}>
                    Обновить
                  </button>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Поиск пользователей по имени, email, телефону или роли..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ fontSize: '13px', padding: '6px 10px' }}
                  />
                </div>

                {loading ? (
                  <p style={{ textAlign: 'center', padding: '20px' }}>Загрузка пользователей...</p>
                ) : filteredUsers.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    {userSearch ? 'Пользователей по запросу не найдено' : 'Список пользователей пуст'}
                  </p>
                ) : (
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>№</th>
                          <th>Имя</th>
                          <th>Email</th>
                          <th>Телефон</th>
                          <th>Роль</th>
                          <th>Сменить роль</th>
                          <th>Удалить</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u, idx) => (
                          <tr key={u.id}>
                            <td>№ {idx + 1}</td>
                            <td><strong>{u.name}</strong></td>
                            <td>{u.email}</td>
                            <td>{formatPhoneNumber(u.phone) || u.phone || '—'}</td>
                            <td>
                              <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                                {u.role === 'admin' ? 'Администратор' : 'Клиент'}
                              </span>
                            </td>
                            <td>
                              {u.email.toLowerCase() === 'admin@lavka.ru' ? (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Главный администратор
                                </span>
                              ) : u.id === currentUser?.id ? (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Текущий аккаунт
                                </span>
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  style={{
                                    padding: '4px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px'
                                  }}
                                >
                                  <option value="user">Клиент (user)</option>
                                  <option value="admin">Администратор (admin)</option>
                                </select>
                              )}
                            </td>
                            <td>
                              {u.email.toLowerCase() === 'admin@lavka.ru' || u.id === currentUser?.id ? (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>—</span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  style={{ color: 'var(--danger-color)' }}
                                  onClick={() => handleDeleteUser(u.id)}
                                  title="Удалить пользователя"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Закрыть</button>
        </div>
      </div>

      {/* Вложенная модалка добавления / редактирования услуги */}
      {isServiceModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? 'Редактирование услуги' : 'Новая услуга'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsServiceModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveService}>
              <div className="modal-body">
                {serviceModalError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--danger-color)',
                    color: 'var(--danger-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '13px'
                  }}>
                    ⚠️ {serviceModalError}
                  </div>
                )}
                <div className="form-group">
                  <label>Название услуги:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Например: Праздничная укладка"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Категория услуги:</label>
                  <select
                    className="form-control"
                    value={sCat}
                    onChange={(e) => setSCat(e.target.value)}
                    required
                  >
                    <option value="Без категории">Без категории</option>
                    {categories.filter(c => c.name !== 'Без категории').map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                    <option value="__new__">+ Создать новую категорию...</option>
                  </select>
                </div>

                {sCat === '__new__' && (
                  <div className="form-group" style={{ marginTop: '8px' }}>
                    <label>Название новой категории:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Например: Спа-процедуры"
                      value={sNewCatName}
                      onChange={(e) => setSNewCatName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Базовая цена (₽):</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      placeholder="2500"
                      value={sPrice}
                      onChange={(e) => setSPrice(e.target.value)}
                      required
                    />
                    {sPrice !== '' && Number(sPrice) <= 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--danger-color)', marginTop: '4px', fontWeight: '500' }}>
                        ⚠️ Цена должна быть строго больше 0 ₽
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Скидка (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      step="1"
                      className="form-control"
                      placeholder="0"
                      value={sDiscount}
                      onChange={(e) => setSDiscount(e.target.value)}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      От 0 до 99%
                    </div>
                  </div>

                  <div className="form-group">
                    <label>На складе (шт.):</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      placeholder="10"
                      value={sStock}
                      onChange={(e) => setSStock(e.target.value)}
                      required
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Остаток услуг/товаров
                    </div>
                  </div>
                </div>

                {/* Сообщение об ошибке недопустимой скидки прямо под полем */}
                {sDiscount !== '' && (Number(sDiscount) < 0 || Number(sDiscount) >= 100) && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--danger-color)',
                    color: 'var(--danger-color)',
                    marginBottom: '14px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    {Number(sDiscount) < 0
                      ? '⚠️ Ошибка: скидка не может быть меньше 0%'
                      : '⚠️ Ошибка: скидка не может быть 100% или больше (максимум 99%)'}
                  </div>
                )}

                {/* Предпросмотр цены с учетом валидной скидки */}
                {Number(sPrice) > 0 && Number(sDiscount) > 0 && Number(sDiscount) <= 99 && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: '14px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>Итоговая цена для клиентов:</span>
                    <div>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', marginRight: '8px' }}>
                        {formatPrice(Number(sPrice))}
                      </span>
                      <strong style={{ color: '#ef4444', fontSize: '15px' }}>
                        {formatPrice(calculateFinalPrice(sPrice, sDiscount))} (-{sDiscount}%)
                      </strong>
                    </div>
                  </div>
                )}

                {/* Выбор длительности: часы и минуты (максимум 6 часов работы мастера) */}
                <div className="form-group">
                  <label>Длительность услуги (максимум 6 часов работы мастера):</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Часы (0 - 6):</span>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        className="form-control"
                        value={sHours}
                        onChange={(e) => {
                          const h = Math.min(6, Math.max(0, parseInt(e.target.value, 10) || 0));
                          setSHours(h);
                          if (h === 6) setSMinutes(0);
                        }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Минуты:</span>
                      <select
                        className="form-control"
                        value={sMinutes}
                        disabled={sHours >= 6}
                        onChange={(e) => setSMinutes(Number(e.target.value))}
                      >
                        <option value={0}>0 мин</option>
                        <option value={15}>15 мин</option>
                        <option value={20}>20 мин</option>
                        <option value={30}>30 мин</option>
                        <option value={40}>40 мин</option>
                        <option value={45}>45 мин</option>
                        <option value={50}>50 мин</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '12px', color: (sHours * 60 + sMinutes) > 360 ? 'var(--danger-color)' : 'var(--accent-color)', fontWeight: '500' }}>
                    {(sHours * 60 + sMinutes) > 360 ? (
                      <span>⚠️ Превышен лимит смены мастера (максимум 6 часов / 360 минут)!</span>
                    ) : (
                      <span>Итого: <strong>{formatDuration(sHours * 60 + sMinutes)}</strong> ({sHours * 60 + sMinutes} мин из 360 макс.)</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Описание услуги:</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={sDesc}
                    onChange={(e) => setSDesc(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label>URL изображения:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="/images/services/styling.jpg"
                      value={sImg}
                      onChange={(e) => setSImg(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setSImg('/images/services/styling.jpg')}
                      title="Вернуть стандартное фото"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Сброс
                    </button>
                    {sImg && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ color: 'var(--danger-color)', whiteSpace: 'nowrap' }}
                        onClick={() => setSImg('')}
                        title="Удалить фото"
                      >
                        Удалить
                      </button>
                    )}
                  </div>

                  {/* Предпросмотр изображения прямо в модалке редактирования */}
                  {sImg && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.03)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <img
                        src={sImg}
                        alt="Предпросмотр"
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/services/styling.jpg'; }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>Предпросмотр фотографии</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Администратор может проверить корректность отображения перед сохранением
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsServiceModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Сохранить услугу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Вложенная модалка редактирования категории */}
      {isEditCatModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Редактирование категории</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsEditCatModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveEditCategory}>
              <div className="modal-body">
                {catModalError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--danger-color)',
                    color: 'var(--danger-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '13px'
                  }}>
                    ⚠️ {catModalError}
                  </div>
                )}
                <div className="form-group">
                  <label>Название категории:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Описание категории:</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={editCatDesc}
                    onChange={(e) => setEditCatDesc(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditCatModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Сохранить категорию
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
