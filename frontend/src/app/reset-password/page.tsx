"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, CheckCircle, AlertCircle, Eye, EyeOff, Leaf } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. No token provided.");
      setTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-reset-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resetToken: token })
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Invalid or expired reset token");
          setTokenValid(false);
          return;
        }

        setTokenValid(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify token");
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 10;
    return Math.min(strength, 100);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(calculatePasswordStrength(pwd));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resetToken: token,
          newPassword: password 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setBusy(false);
    }
  };

  if (tokenValid === null) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: "400px", margin: "0 auto", width: "100%" }}>
          <div style={{ background: "var(--surface)", borderRadius: "20px", boxShadow: "var(--shadow)", padding: "60px 40px", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", border: "4px solid var(--line)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
            <p style={{ color: "var(--muted)", fontWeight: 600 }}>Verifying your reset link...</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (tokenValid === false) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", width: "100%" }}>
          <div style={{ background: "var(--surface)", borderRadius: "20px", boxShadow: "var(--shadow)", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #b42318 0%, #8b1a13 100%)", padding: "40px", textAlign: "center", color: "white" }}>
              <AlertCircle size={48} style={{ margin: "0 auto 15px", display: "block" }} />
              <h2 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 10px 0" }}>Invalid Link</h2>
              <p style={{ opacity: 0.9, margin: 0 }}>{error}</p>
            </div>
            <div style={{ padding: "30px", textAlign: "center" }}>
              <Link href="/forgot-password" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 30px", background: "var(--brand)", color: "white", borderRadius: "12px", textDecoration: "none", fontWeight: 700, transition: "all 0.3s ease" }}>
                <ArrowRight size={16} />
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", width: "100%" }}>
          <div style={{ background: "var(--surface)", borderRadius: "20px", boxShadow: "var(--shadow)", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, var(--brand) 0%, #1e5231 100%)", padding: "40px", textAlign: "center", color: "white" }}>
              <CheckCircle size={48} style={{ margin: "0 auto 15px", display: "block" }} />
              <h2 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 10px 0" }}>Success!</h2>
              <p style={{ opacity: 0.9, margin: 0 }}>Your password has been reset</p>
            </div>
            <div style={{ padding: "30px", textAlign: "center" }}>
              <p style={{ color: "var(--muted)", marginBottom: "20px" }}>You'll be redirected to login in a moment...</p>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 30px", background: "var(--brand)", color: "white", borderRadius: "12px", textDecoration: "none", fontWeight: 700 }}>
                <ArrowRight size={16} />
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(47, 107, 63, 0.03) 0%, rgba(201, 130, 42, 0.02) 100%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: "500px", margin: "60px auto", padding: "20px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
            <Leaf size={32} color="var(--brand)" />
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, color: "var(--text)" }}>Create New Password</h1>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "15px", margin: 0 }}>Enter a strong password to secure your account</p>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, var(--brand) 0%, #1e5231 100%)", padding: "32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "150px", height: "150px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "50%" }} />
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <Lock size={40} color="white" style={{ marginBottom: "12px" }} />
              <h2 style={{ color: "white", margin: "0 0 8px 0", fontSize: "24px", fontWeight: 900 }}>Set New Password</h2>
              <p style={{ color: "rgba(255, 255, 255, 0.85)", margin: 0, fontSize: "14px" }}>Make sure it's strong and unique</p>
            </div>
          </div>

          <div style={{ padding: "32px" }}>
            {error && (
              <div style={{ padding: "14px 16px", background: "rgba(180, 35, 24, 0.1)", border: "1px solid rgba(180, 35, 24, 0.3)", color: "var(--danger)", borderRadius: "10px", marginBottom: "24px", fontSize: "14px", fontWeight: 600 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: 700, color: "var(--text)", fontSize: "14px" }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    style={{ width: "100%", padding: "12px 48px", borderRadius: "12px", border: "2px solid var(--line)", fontSize: "15px", fontWeight: 500, boxSizing: "border-box", outline: "none" }}
                    placeholder="Enter new password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {password && (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ height: "6px", background: "var(--line)", borderRadius: "999px", overflow: "hidden", marginBottom: "6px" }}>
                      <div style={{ height: "100%", width: `${passwordStrength}%`, background: passwordStrength < 50 ? "var(--danger)" : passwordStrength < 80 ? "var(--accent)" : "var(--brand)", transition: "all 0.3s ease" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: passwordStrength < 50 ? "var(--danger)" : passwordStrength < 80 ? "var(--accent)" : "var(--brand)" }}>
                      {passwordStrength < 50 ? "Weak" : passwordStrength < 80 ? "Good" : "Strong"}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: 700, color: "var(--text)", fontSize: "14px" }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: "12px", border: "2px solid var(--line)", fontSize: "15px", fontWeight: 500, boxSizing: "border-box", outline: "none" }}
                    placeholder="Confirm password"
                  />
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle size={18} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--brand)" }} />
                  )}
                </div>
              </div>

              <div style={{ background: "var(--surface-muted)", borderRadius: "10px", padding: "16px", marginBottom: "24px", borderLeft: "4px solid var(--brand)" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", margin: "0 0 10px 0" }}>Password Requirements:</p>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--muted)" }}>
                  <li style={{ marginBottom: "4px" }}>At least 6 characters long</li>
                  <li>Passwords must match</li>
                </ul>
              </div>

              <button type="submit" disabled={busy} style={{ width: "100%", padding: "14px 24px", background: busy ? "var(--muted)" : "var(--brand)", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, transition: "all 0.3s ease" }}>
                {busy ? "Resetting..." : "Reset Password"}
                {!busy && <ArrowRight size={18} />}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Link href="/login" style={{ color: "var(--brand)", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "var(--bg)" }}></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
