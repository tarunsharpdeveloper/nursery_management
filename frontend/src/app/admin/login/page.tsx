"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { apiRequest, getStoredUser, storeAdminSession, type AdminUser } from "@/lib/api";

type LoginResponse = {
  token: string;
  user: AdminUser;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Use the role credentials assigned by the owner.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (getStoredUser()) {
      router.replace("/admin/dashboard");
      return;
    }

    // Push a history entry so the browser back button can be intercepted
    window.history.pushState({ from: "admin-login" }, "");

    function handlePopState() {
      router.replace("/");
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  async function login() {
    // Validate form
    if (!email.trim()) {
      setStatus("Email is required");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (!password.trim()) {
      setStatus("Password is required");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (password.length < 6) {
      setStatus("Password must be at least 6 characters");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setBusy(true);
    try {
      const response = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      storeAdminSession(response.token, response.user);
      router.replace("/admin/dashboard");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Nursery admin portal">
        <div className="login-visual-content">
          <p className="eyebrow">Green Nursery Admin</p>
          <h1>Manage every nursery operation from one secure portal.</h1>
          <div className="login-highlights">
            <span><ShieldCheck size={16} /> Role based access</span>
            <span><UserRound size={16} /> Staff permissions</span>
            <span><KeyRound size={16} /> Secure session</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">Admin Login</p>
          <h2>Welcome back</h2>
          <p 
            className="meta" 
            style={{
              color: status !== "Use the role credentials assigned by the owner." ? '#b42318' : 'inherit',
              background: status !== "Use the role credentials assigned by the owner." ? '#fff0f0' : 'transparent',
              padding: status !== "Use the role credentials assigned by the owner." ? '12px 14px' : '0',
              borderRadius: status !== "Use the role credentials assigned by the owner." ? '8px' : '0',
              border: status !== "Use the role credentials assigned by the owner." ? '1px solid #ffd0d0' : 'none',
              fontWeight: status !== "Use the role credentials assigned by the owner." ? 700 : 400,
              marginBottom: status !== "Use the role credentials assigned by the owner." ? '20px' : '0',
              animation: status !== "Use the role credentials assigned by the owner." ? 'slideDown 0.3s ease-out' : 'none'
            }}
          >
            {status}
          </p>
          <form onInvalid={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
            <label className="field">
              <span>Email <span style={{ color: '#dc2626', fontWeight: 700 }}>*</span></span>
              <input 
                value={email} 
                onChange={(event) => setEmail(event.target.value)} 
                autoComplete="email" 
                required
                style={{
                  borderColor: status?.includes('Email') ? '#dc2626' : undefined,
                  backgroundColor: status?.includes('Email') ? '#fff5f5' : undefined
                }}
              />
            </label>
            <label className="field">
              <span>Password <span style={{ color: '#dc2626', fontWeight: 700 }}>*</span></span>
              <input 
                type="password" 
                value={password} 
                onChange={(event) => setPassword(event.target.value)} 
                autoComplete="current-password" 
                required
                minLength={6}
                style={{
                  borderColor: status?.includes('Password') ? '#dc2626' : undefined,
                  backgroundColor: status?.includes('Password') ? '#fff5f5' : undefined
                }}
              />
            </label>
            <button className="button login-button" type="button" onClick={login} disabled={busy}>
              <LogIn size={18} />
              {busy ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
