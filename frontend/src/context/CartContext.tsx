"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: number;
  cartKey?: string;
  variant_id?: number | null;
  variant_label?: string | null;
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
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
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
      const cartKey = product.cartKey || String(product.id);
      const existing = prev.find((item) => (item.cartKey || String(item.id)) === cartKey);
      const limit = product.available_quantity || 99;
      if (existing) {
        const newQty = Math.min(limit, existing.quantity + qty);
        return prev.map((item) =>
          (item.cartKey || String(item.id)) === cartKey ? { ...item, quantity: newQty } : item
        );
      } else {
        return [
          ...prev,
          {
            id: product.id,
            cartKey,
            variant_id: product.variant_id || null,
            variant_label: product.variant_label || null,
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

  const removeFromCart = (cartKey: string) => {
    setCartItems((prev) => prev.filter((item) => (item.cartKey || String(item.id)) !== cartKey));
  };

  const updateQuantity = (cartKey: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if ((item.cartKey || String(item.id)) === cartKey) {
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
