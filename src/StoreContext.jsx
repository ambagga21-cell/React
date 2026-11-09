import { createContext, useEffect, useReducer } from "react";

export const StoreContext = createContext(null);

const initialState = {
  cart: [],
  theme: "light",
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TO_CART":
      return { ...state, cart: [...state.cart, action.product] };
    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((_, index) => index !== action.index),
      };
    case "TOGGLE_THEME":
      return {
        ...state,
        theme: state.theme === "light" ? "dark" : "light",
      };
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  const value = {
    cart: state.cart,
    theme: state.theme,
    total: state.cart.reduce((sum, item) => sum + item.price, 0),
    addToCart: (product) => dispatch({ type: "ADD_TO_CART", product }),
    removeFromCart: (index) => dispatch({ type: "REMOVE_FROM_CART", index }),
    toggleTheme: () => dispatch({ type: "TOGGLE_THEME" }),
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
