"use client";
import { createContext, useContext, useState, useEffect } from 'react';

// Create the Context
const CartContext = createContext();

// Create a Provider component
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [userAddress, setUserAddress] = useState(null);

  useEffect(() => {
    // Load cart from localStorage on initial render
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing saved cart:", e);
      }
    }

    // Load user address
    const savedAddress = localStorage.getItem("userAddress");
    if (savedAddress) {
      try {
        setUserAddress(JSON.parse(savedAddress));
      } catch (e) {
        console.error("Error parsing saved address:", e);
      }
    }
  }, []);

  // Update cart and localStorage
  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const increaseQuantity = (index) => {
    const newCart = [...cart];
    newCart[index].quantity += 1;
    updateCart(newCart);
  };

  const decreaseQuantity = (index) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
      updateCart(newCart);
    } else {
      removeItem(index);
    }
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    updateCart(newCart);
  };

  const addItem = (item) => {
    // Check if the item already exists in the cart
    const existingItemIndex = cart.findIndex((cartItem) => 
      cartItem.id === item.id
    );

    if (existingItemIndex >= 0) {
      // Item exists, increase quantity
      increaseQuantity(existingItemIndex);
    } else {
      // Item doesn't exist, add it with quantity 1
      const newItem = { ...item, quantity: 1 };
      updateCart([...cart, newItem]);
    }
  };

  const clearCart = () => {
    updateCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.cost * item.quantity), 0);
  };

  const updateAddress = (address) => {
    setUserAddress(address);
    localStorage.setItem("userAddress", JSON.stringify(address));
  };

  // Value to be provided to consumers
  const value = {
    cart,
    userAddress,
    updateCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    addItem,
    clearCart,
    calculateTotal,
    updateAddress
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};