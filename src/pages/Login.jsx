import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useStore } from "../StoreContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const navigate = useNavigate();
  const { user, authLoading, login } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const nextErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = "Введите email.";
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = "Введите корректный email.";
    }

    if (!password) {
      nextErrors.password = "Введите пароль.";
    } else if (password.length < 6) {
      nextErrors.password = "Пароль должен содержать не менее 6 символов.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <>
        <h1>Вход</h1>
        <p className="status">Проверка сессии...</p>
      </>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <h1>Вход</h1>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="user@lavka.ru"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <span className="field-error" role="alert">
              {errors.email}
            </span>
          )}
        </label>

        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && (
            <span className="field-error" role="alert">
              {errors.password}
            </span>
          )}
        </label>

        {serverError && (
          <p className="status status--error" role="alert">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Вход..." : "Войти"}
        </button>
      </form>

      <p>
        <Link to="/">Вернуться в каталог</Link>
      </p>
    </>
  );
}

export default Login;
