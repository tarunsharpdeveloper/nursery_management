"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { ArrowRight, Leaf, Lock, Mail, PackageCheck, Phone, Sprout, User } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { login, register, user, isLoaded } = useCustomerAuth();

  const [isLoginView, setIsLoginView] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (isLoginView) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.phone, formData.password);
      }
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      router.push(redirect);
    }
  }, [isLoaded, user, redirect, router]);

  if (!isLoaded || user) return <div style={{ height: "60vh" }}></div>;

  return (
    <div className="login-wrapper" style={{ padding: "80px 0", background: "var(--light)", minHeight: "calc(100vh - 200px)" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="login-card" style={{
              background: "#fff",
              borderRadius: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
              overflow: "hidden"
            }}>
              <div className="login-header" style={{
                background: "linear-gradient(135deg, var(--brand) 0%, #4a8215 100%)",
                padding: "40px",
                textAlign: "center",
                color: "white"
              }}>
                <h2 style={{ color: "white", marginBottom: "10px" }}>
                  {isLoginView ? "Welcome Back" : "Create Account"}
                </h2>
                <p style={{ opacity: 0.9, margin: 0 }}>
                  {isLoginView
                    ? "Sign in to track your orders and checkout faster."
                    : "Join us for a premium nursery experience."}
                </p>
              </div>

              <div className="login-body" style={{ padding: "40px" }}>
                {error && (
                  <div style={{
                    padding: "12px 20px",
                    background: "#fee",
                    color: "#c00",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "14px"
                  }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {!isLoginView && (
                    <>
                      <div className="form-group" style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#333" }}>Full Name</label>
                        <div style={{ position: "relative" }}>
                          <User size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: "12px", border: "1px solid #ddd" }}
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#333" }}>Phone Number</label>
                        <div style={{ position: "relative" }}>
                          <Phone size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
                          <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: "12px", border: "1px solid #ddd" }}
                            placeholder="9876543210"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group" style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#333" }}>Email Address</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: "12px", border: "1px solid #ddd" }}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "30px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#333" }}>Password</label>
                    <div style={{ position: "relative" }}>
                      <Lock size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: "12px", border: "1px solid #ddd" }}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: "var(--brand)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: 700,
                      fontSize: "16px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "10px",
                      cursor: busy ? "not-allowed" : "pointer",
                      opacity: busy ? 0.7 : 1,
                      transition: "all 0.3s ease"
                    }}
                  >
                    {busy ? "Please wait..." : isLoginView ? "Sign In" : "Create Account"}
                    {!busy && <ArrowRight size={18} />}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
                  <p style={{ color: "#666", marginBottom: 0 }}>
                    {isLoginView ? "Don't have an account?" : "Already have an account?"}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginView(!isLoginView);
                        setError("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--brand)",
                        fontWeight: 700,
                        marginLeft: "8px",
                        cursor: "pointer",
                        textDecoration: "underline"
                      }}
                    >
                      {isLoginView ? "Sign Up" : "Log In"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const mode = searchParams.get("mode");

  const { login, register, user, isLoaded } = useCustomerAuth();

  const [isLoginView, setIsLoginView] = useState(mode !== "signup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (isLoaded && user) {
      router.push(redirect);
    }
  }, [isLoaded, user, redirect, router]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (isLoginView) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.phone, formData.password);
      }
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setBusy(false);
    }
  };

  if (!isLoaded || user) return <div style={{ height: "60vh" }}></div>;

  return (
    <main className="login-page customer-login-page">
      <section className="login-visual" aria-label="Customer account portal">
        <div className="login-visual-content">
          <p className="eyebrow">Awantika Seeds Customer</p>
          <h1>Track your nursery orders from one simple account.</h1>
          <div className="login-highlights">
            <span><PackageCheck size={16} /> Order tracking</span>
            <span><Leaf size={16} /> Fresh stock updates</span>
            <span><Sprout size={16} /> Faster checkout</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">Customer Login</p>
          <h2>{isLoginView ? "Welcome back" : "Create account"}</h2>
          <p className="meta">
            {isLoginView
              ? "Sign in to view your orders and continue shopping."
              : "Register once and use the same account for orders."}
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLoginView && (
              <>
                <label className="field icon-field">
                  <span>Full Name</span>
                  <div>
                    <User size={18} />
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                  </div>
                </label>

                <label className="field icon-field">
                  <span>Phone Number</span>
                  <div>
                    <Phone size={18} />
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} required placeholder="9876543210" />
                  </div>
                </label>
              </>
            )}

            <label className="field icon-field">
              <span>Email Address</span>
              <div>
                <Mail size={18} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />
              </div>
            </label>

            <label className="field icon-field">
              <span>Password</span>
              <div>
                <Lock size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Enter your password"
                />
              </div>
            </label>

            <button type="submit" disabled={busy} className="button login-button">
              {busy ? "Please wait..." : isLoginView ? "Sign In" : "Create Account"}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-switch">
            <p>
              {isLoginView ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button" style={{ background: "transparent", border: "none", color: "var(--brand)", fontWeight: 700, marginLeft: "8px", cursor: "pointer", textDecoration: "underline", marginTop: '10px' }}
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setError("");
                }}
              >
                {isLoginView ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ height: "60vh" }}></div>}>
      <CustomerLoginContent />
    </Suspense>
  );
}
