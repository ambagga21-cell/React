import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api";
import { useStore } from "../StoreContext";
import { formatDate, formatPrice } from "../utils";

function Dashboard() {
  const { user, authLoading, logout, services, loadCatalog } = useStore();
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [adminData, setAdminData] = useState({ users: [], coupons: [] });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [couponUserId, setCouponUserId] = useState("");
  const [couponId, setCouponId] = useState("");
  const [discountServiceId, setDiscountServiceId] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  const loadAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    setAppointmentsError("");

    try {
      const data = await api.getAppointments();
      setAppointments(data.appointments);
    } catch (error) {
      setAppointmentsError(error.message);
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    setAdminLoading(true);
    setAdminError("");

    try {
      const [usersData, couponsData] = await Promise.all([
        api.getUsers(),
        api.getCoupons(),
      ]);
      setAdminData({
        users: usersData.users,
        coupons: couponsData.coupons,
      });
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, loadAppointments]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadAdminData();
    }
  }, [user, loadAdminData]);

  async function handleCategorySubmit(event) {
    event.preventDefault();
    const name = categoryName.trim();

    if (name.length < 2) {
      setAdminMessage("");
      setAdminError("Название категории должно содержать не менее 2 символов.");
      return;
    }

    setActionLoading("category");
    setAdminError("");
    setAdminMessage("");

    try {
      await api.createCategory(name);
      setCategoryName("");
      await loadCatalog();
      setAdminMessage(`Категория «${name}» добавлена.`);
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setActionLoading("");
    }
  }

  async function handleCouponSubmit(event) {
    event.preventDefault();

    if (!couponUserId) {
      return;
    }

    setActionLoading("coupon");
    setAdminError("");
    setAdminMessage("");

    try {
      await api.assignCoupon(
        Number(couponUserId),
        couponId ? Number(couponId) : null,
      );
      await loadAdminData();
      setAdminMessage("Персональная скидка назначена.");
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setActionLoading("");
    }
  }

  async function handleDiscountSubmit(event) {
    event.preventDefault();
    const percent = Number(discountPercent);

    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      setAdminMessage("");
      setAdminError("Скидка должна быть целым числом от 0 до 100.");
      return;
    }

    setActionLoading("discount");
    setAdminError("");
    setAdminMessage("");

    try {
      await api.setServiceDiscount(Number(discountServiceId), percent);
      await loadCatalog();
      setAdminMessage("Скидка на услугу обновлена.");
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setActionLoading("");
    }
  }

  if (authLoading) {
    return (
      <>
        <h1>Личный кабинет</h1>
        <p className="status">Проверка сессии...</p>
      </>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === "admin";

  return (
    <>
      <h1>Личный кабинет</h1>

      <div className="profile">
        <p>
          <strong>{user.name}</strong>
        </p>
        <p>{user.email}</p>
        <p>Роль: {isAdmin ? "Администратор" : "Клиент"}</p>
        <p>
          Персональная скидка:{" "}
          {user.coupon
            ? `«${user.coupon.name}» — ${user.coupon.discountPercent}%`
            : "не назначена"}
        </p>
      </div>

      <h2>{isAdmin ? "Все записи" : "Мои записи"}</h2>

      {appointmentsLoading && (
        <p className="status" role="status">
          Загрузка записей...
        </p>
      )}

      {appointmentsError && (
        <div className="status status--error" role="alert">
          <p>{appointmentsError}</p>
          <button type="button" onClick={loadAppointments}>
            Повторить загрузку
          </button>
        </div>
      )}

      {!appointmentsLoading &&
        !appointmentsError &&
        appointments.length === 0 && <p className="muted">Записей пока нет.</p>}

      {appointments.length > 0 && (
        <ul className="appointments">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <div className="appointments__info">
                <span className="appointments__name">
                  {appointment.serviceName}
                </span>
                {isAdmin && (
                  <span className="muted">
                    {appointment.userName} ({appointment.userEmail})
                  </span>
                )}
              </div>
              <span>{appointment.quantity} шт.</span>
              <span>{formatPrice(appointment.total)}</span>
              <span className="badge badge--success">
                {appointment.paymentStatus === "paid"
                  ? "Оплачено"
                  : "Ожидает оплаты"}
              </span>
              <span className="muted">
                {formatDate(appointment.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isAdmin && (
        <section className="admin">
          <h2>Админ-панель</h2>

          {adminLoading && (
            <p className="status" role="status">
              Загрузка данных администратора...
            </p>
          )}

          {adminError && (
            <p className="status status--error" role="alert">
              {adminError}
            </p>
          )}

          {adminMessage && (
            <p className="status status--success" role="status">
              {adminMessage}
            </p>
          )}

          <div className="admin-grid">
            <form className="admin-form" onSubmit={handleCategorySubmit}>
              <h3>Добавить категорию</h3>
              <label className="field">
                <span>Название</span>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Например, Эпиляция"
                />
              </label>
              <button
                type="submit"
                disabled={actionLoading === "category"}
              >
                {actionLoading === "category"
                  ? "Добавление..."
                  : "Добавить категорию"}
              </button>
            </form>

            <form className="admin-form" onSubmit={handleCouponSubmit}>
              <h3>Персональная скидка</h3>
              <label className="field">
                <span>Пользователь</span>
                <select
                  value={couponUserId}
                  onChange={(event) => setCouponUserId(event.target.value)}
                >
                  <option value="">Выберите пользователя</option>
                  {adminData.users.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name} ({item.email})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Купон</span>
                <select
                  value={couponId}
                  onChange={(event) => setCouponId(event.target.value)}
                >
                  <option value="">Без купона</option>
                  {adminData.coupons.map((coupon) => (
                    <option value={coupon.id} key={coupon.id}>
                      {coupon.name} — {coupon.discountPercent}%
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={!couponUserId || actionLoading === "coupon"}
              >
                {actionLoading === "coupon"
                  ? "Назначение..."
                  : "Назначить купон"}
              </button>
            </form>

            <form className="admin-form" onSubmit={handleDiscountSubmit}>
              <h3>Скидка на услугу</h3>
              <label className="field">
                <span>Услуга</span>
                <select
                  value={discountServiceId}
                  onChange={(event) => {
                    const serviceId = event.target.value;
                    const service = services.find(
                      (item) => String(item.id) === serviceId,
                    );
                    setDiscountServiceId(serviceId);
                    setDiscountPercent(
                      service ? String(service.discountPercent) : "",
                    );
                  }}
                >
                  <option value="">Выберите услугу</option>
                  {services.map((service) => (
                    <option value={service.id} key={service.id}>
                      {service.name} ({service.discountPercent}%)
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Скидка, %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discountPercent}
                  onChange={(event) =>
                    setDiscountPercent(event.target.value)
                  }
                />
              </label>
              <button
                type="submit"
                disabled={
                  !discountServiceId ||
                  discountPercent === "" ||
                  actionLoading === "discount"
                }
              >
                {actionLoading === "discount"
                  ? "Сохранение..."
                  : "Сохранить скидку"}
              </button>
            </form>
          </div>

          <h3>Пользователи и купоны</h3>
          {adminData.users.length === 0 && !adminLoading ? (
            <p className="muted">Пользователей нет.</p>
          ) : (
            <ul className="admin-users">
              {adminData.users.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <span className="muted">{item.email}</span>
                  <span>
                    {item.coupon
                      ? `${item.coupon.name} — ${item.coupon.discountPercent}%`
                      : "Без купона"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <button type="button" className="logout" onClick={logout}>
        Выйти
      </button>
      <p>
        <Link to="/">Вернуться в каталог</Link>
      </p>
    </>
  );
}

export default Dashboard;
