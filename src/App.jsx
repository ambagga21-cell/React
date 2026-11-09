import { Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import Cart from "./pages/Cart";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Products from "./pages/Products";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
