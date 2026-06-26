"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  token: string | null;
  isLoaded: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

function getErrorMessage(payload: any, fallback: string) {
  if (Array.isArray(payload?.error) && payload.error[0]?.message) {
    return payload.error[0].message;
  }
  return payload?.message || fallback;
}

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("customer_token");
    const storedUser = localStorage.getItem("customer_user");
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse customer_user:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const storeSession = (newToken: string, newUser: CustomerUser) => {
    localStorage.setItem("customer_token", newToken);
    localStorage.setItem("customer_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    const payload = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(payload, "Login failed"));
    
    if (payload.user.role !== "customer") {
      throw new Error("This account is not a customer account.");
    }

    storeSession(payload.token, payload.user);
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/auth/register-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password })
    });
    
    const payload = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(payload, "Registration failed"));

    storeSession(payload.token, payload.user);
  };

  const logout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    setToken(null);
    setUser(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ user, token, isLoaded, login, register, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
