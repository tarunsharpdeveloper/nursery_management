"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { apiRequest, storeAdminSession, type AdminUser } from "@/lib/api";

type LoginResponse = {
  token: string;
  user: AdminUser;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@nursery.local");
  const [password, setPassword] = useState("owner123");
  const [status, setStatus] = useState("Use the role credentials assigned by the owner.");
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    try {
      const response = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      storeAdminSession(response.token, response.user);
      router.replace("/admin");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    } finally {
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
          <p className="meta">{status}</p>
          <form>
            <label className="field">
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </label>
            <button className="button login-button" type="button" onClick={login} disabled={busy}>
              <LogIn size={18} />
              {busy ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="role-list">
          <div>
            <strong>Super Admin</strong>
            <span>owner@nursery.local / owner123</span>
          </div>
          <div>
            <strong>Staff User</strong>
            <span>staff@nursery.local / staff123</span>
          </div>
          <div>
            <strong>Billing User</strong>
            <span>billing@nursery.local / billing123</span>
          </div>
        </div>
      </section>
    </main>
  );
}
