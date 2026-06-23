"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: number;
  name: string;
  category: string;
  selling_price: number;
  actual_price: number;
  photo_url: string | null;
  quantity: number;
  available_quantity: number;
  unit: string | null;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("awantika_cart");
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cart items:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage when changed
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("awantika_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addToCart = (product: any, qty: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const limit = product.available_quantity || 99;
      if (existing) {
        const newQty = Math.min(limit, existing.quantity + qty);
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            category: product.category || "General",
            selling_price: Number(product.selling_price || product.price || 0),
            actual_price: Number(product.actual_price || product.price || 0),
            photo_url: product.photo_url || product.image || null,
            quantity: Math.min(limit, qty),
            available_quantity: limit,
            unit: product.unit || null,
          },
        ];
      }
    });
  };

  const removeFromCart = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const limit = item.available_quantity || 99;
          return { ...item, quantity: Math.max(1, Math.min(limit, qty)) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 120;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
