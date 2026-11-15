import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { api, getToken, setToken } from "./api";

export const StoreContext = createContext(null);

const THEME_STORAGE_KEY = "theme";
const USER_STORAGE_KEY = "user";
const CART_STORAGE_KEY = "cart";

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : "light";
}

function getInitialUser() {
  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getInitialCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const initialState = {
  cart: getInitialCart(),
  theme: getInitialTheme(),
  user: getInitialUser(),
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TO_CART": {
      const service = action.service;
      const existing = state.cart.find((item) => item.id === service.id);

      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === service.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }

      return {
        ...state,
        cart: [
          ...state.cart,
          {
            id: service.id,
            name: service.name,
            price: service.price,
            durationMinutes: service.durationMinutes,
            discountPercent: service.discountPercent,
            categoryName: service.categoryName,
            quantity: 1,
          },
        ],
      };
    }
    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.id),
      };
    case "INCREASE_QUANTITY":
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      };
    case "DECREASE_QUANTITY":
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.id && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        ),
      };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "TOGGLE_THEME":
      return {
        ...state,
        theme: state.theme === "light" ? "dark" : "light",
      };
    case "SET_USER":
      return { ...state, user: action.user };
    case "LOGOUT":
      return { ...state, user: null };
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [authLoading, setAuthLoading] = useState(Boolean(getToken()));
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem(THEME_STORAGE_KEY, state.theme);
  }, [state.theme]);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [state.user]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  }, [state.cart]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getToken()) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await api.me();

        if (!cancelled) {
          dispatch({ type: "SET_USER", user: data.user });
        }
      } catch (error) {
        if (!cancelled && error.status === 401) {
          setToken(null);
          dispatch({ type: "LOGOUT" });
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError("");

    try {
      const [servicesData, categoriesData] = await Promise.all([
        api.getServices(),
        api.getCategories(),
      ]);
      setServices(servicesData.services);
      setCategories(categoriesData.categories);
    } catch (error) {
      setCatalogError(error.message);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    dispatch({ type: "SET_USER", user: data.user });
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    dispatch({ type: "LOGOUT" });
  }, []);

  const couponPercent = state.user?.coupon?.discountPercent || 0;

  const totals = useMemo(() => {
    let subtotal = 0;
    let serviceDiscount = 0;
    let couponDiscount = 0;

    for (const item of state.cart) {
      const base = item.price * item.quantity;
      const itemDiscount = Math.round(
        (base * (item.discountPercent || 0)) / 100,
      );
      const afterServiceDiscount = base - itemDiscount;
      const itemCouponDiscount = Math.round(
        (afterServiceDiscount * couponPercent) / 100,
      );

      subtotal += base;
      serviceDiscount += itemDiscount;
      couponDiscount += itemCouponDiscount;
    }

    return {
      subtotal,
      serviceDiscount,
      couponDiscount,
      total: subtotal - serviceDiscount - couponDiscount,
      couponPercent,
    };
  }, [state.cart, couponPercent]);

  const value = {
    cart: state.cart,
    theme: state.theme,
    user: state.user,
    authLoading,
    services,
    categories,
    catalogLoading,
    catalogError,
    loadCatalog,
    cartCount: state.cart.reduce((sum, item) => sum + item.quantity, 0),
    ...totals,
    addToCart: (service) => dispatch({ type: "ADD_TO_CART", service }),
    removeFromCart: (id) => dispatch({ type: "REMOVE_FROM_CART", id }),
    increaseQuantity: (id) => dispatch({ type: "INCREASE_QUANTITY", id }),
    decreaseQuantity: (id) => dispatch({ type: "DECREASE_QUANTITY", id }),
    clearCart: () => dispatch({ type: "CLEAR_CART" }),
    toggleTheme: () => dispatch({ type: "TOGGLE_THEME" }),
    login,
    logout,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);

  if (!value) {
    throw new Error("useStore должен использоваться внутри StoreProvider");
  }

  return value;
}
