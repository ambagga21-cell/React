import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    navigate("/dashboard");
  }

  return (
    <>
      <h1>Вход</h1>

      <form className="form" onSubmit={handleSubmit}>
        <input type="text" placeholder="Имя" required />
        <input type="password" placeholder="Пароль" required />
        <button type="submit">Войти</button>
      </form>
    </>
  );
}

export default Login;
