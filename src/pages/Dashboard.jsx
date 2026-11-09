import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <>
      <h1>Личный кабинет</h1>
      <p>Вы успешно вошли в аккаунт.</p>
      <Link to="/">Вернуться в каталог</Link>
    </>
  );
}

export default Dashboard;
