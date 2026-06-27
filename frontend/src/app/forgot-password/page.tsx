"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle, Leaf, Send } from "lucide-react";

function ForgotPasswordContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setBusy(false);
    }
  };

  if (success) {
    return (
      <main className="reset-success-page" style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
          <div style={{
            background: "var(--surface)",
            borderRadius: "24px",
            boxShadow: "var(--shadow)",
            overflow: "hidden"
          }}>
            {/* Success Header */}
            <div style={{
              background: "linear-gradient(135deg, var(--brand) 0%, #1e5231 100%)",
              padding: "60px 40px",
              textAlign: "center",
              color: "white"
            }}>
              <div style={{ marginBottom: "20px" }}>
                <div style={{
                  width: "100px",
                  height: "100px",
                  margin: "0 auto",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse 2s infinite"
                }}>
                  <CheckCircle size={64} color="white" />
                </div>
              </div>
              <h2 style={{ fontSize: "32px", fontWeight: 900, margin: "0 0 10px 0" }}>Email Sent!</h2>
              <p style={{ opacity: 0.9, margin: 0, fontSize: "16px" }}>We've sent a password reset link</p>
            </div>

            {/* Success Body */}
            <div style={{ padding: "40px" }}>
              <div style={{
                background: "var(--surface-muted)",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "30px",
                borderLeft: "4px solid var(--brand)"
              }}>
                <p style={{ margin: 0, color: "var(--text)", fontWeight: 600 }}>
                  Check your inbox at <strong>{email}</strong>
                </p>
                <p style={{ margin: "8px 0 0 0", color: "var(--muted)", fontSize: "14px" }}>
                  The reset link is valid for 1 hour. Don't see it? Check your spam folder.
                </p>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <Link href="/login" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "14px 24px",
                  background: "var(--brand)",
                  color: "white",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "16px",
                  transition: "all 0.3s ease",
                  border: "2px solid var(--brand)"
                }} onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--brand-dark)";
                  e.currentTarget.style.borderColor = "var(--brand-dark)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--brand)";
                  e.currentTarget.style.borderColor = "var(--brand)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}>
                  <ArrowRight size={18} />
                  Back to Login
                </Link>

                <button
                  onClick={() => setSuccess(false)}
                  style={{
                    padding: "14px 24px",
                    background: "transparent",
                    color: "var(--brand)",
                    border: "2px solid var(--line)",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-muted)";
                    e.currentTarget.style.borderColor = "var(--brand)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--line)";
                  }}
                >
                  Try Another Email
                </button>
              </div>

              <div style={{ marginTop: "30px", paddingTop: "30px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
                <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>
                  💡 <strong>Tip:</strong> Check your email within the next hour before the link expires
                </p>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="forgot-password-page" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Decorative Background */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(135deg, rgba(47, 107, 63, 0.03) 0%, rgba(201, 130, 42, 0.02) 100%)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      <div style={{
        maxWidth: "500px",
        margin: "60px auto",
        padding: "20px",
        position: "relative",
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "20px"
          }}>
            <Leaf size={32} color="var(--brand)" />
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, color: "var(--text)" }}>
              Reset Password
            </h1>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "15px", margin: 0 }}>
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)",
          overflow: "hidden"
        }}>
          {/* Card Header */}
          <div style={{
            background: "linear-gradient(135deg, var(--brand) 0%, #1e5231 100%)",
            padding: "32px 32px 24px",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Decorative Elements */}
            <div style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "200px",
              height: "200px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%"
            }} />
            <div style={{
              position: "absolute",
              bottom: "-60px",
              left: "-60px",
              width: "150px",
              height: "150px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%"
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <Mail size={40} color="white" style={{ marginBottom: "12px" }} />
              <h2 style={{ color: "white", margin: "0 0 8px 0", fontSize: "24px", fontWeight: 900 }}>
                Forgot Your Password?
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.85)", margin: 0, fontSize: "14px" }}>
                No worries! We'll help you reset it.
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div style={{ padding: "32px" }}>
            {error && (
              <div style={{
                padding: "14px 16px",
                background: "rgba(180, 35, 24, 0.1)",
                border: "1px solid rgba(180, 35, 24, 0.3)",
                color: "var(--danger)",
                borderRadius: "10px",
                marginBottom: "24px",
                fontSize: "14px",
                fontWeight: 600
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: 700,
                  color: "var(--text)",
                  fontSize: "14px"
                }}>
                  Email Address
                </label>
                <div style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <Mail size={18} style={{
                    position: "absolute",
                    left: "16px",
                    color: "var(--muted)",
                    pointerEvents: "none"
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 16px 12px 48px",
                      borderRadius: "12px",
                      border: "2px solid var(--line)",
                      fontSize: "15px",
                      fontWeight: 500,
                      transition: "all 0.2s ease",
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                    placeholder="you@example.com"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--brand)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(47, 107, 63, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--line)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  background: busy ? "var(--muted)" : "var(--brand)",
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
                onMouseEnter={(e) => {
                  if (!busy) {
                    e.currentTarget.style.background = "var(--brand-dark)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(47, 107, 63, 0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!busy) {
                    e.currentTarget.style.background = "var(--brand)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {busy ? "Sending..." : "Send Reset Link"}
                {!busy && <Send size={18} />}
              </button>
            </form>

            {/* Divider */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "28px 0",
              color: "var(--line)"
            }}>
              <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
            </div>

            {/* Link Back to Login */}
            <Link href="/login" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 24px",
              color: "var(--brand)",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "15px",
              transition: "all 0.2s ease",
              borderRadius: "12px"
            }} onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-muted)";
            }} onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}>
              <ArrowRight size={18} />
              Back to Login
            </Link>
          </div>

          {/* Card Footer */}
          <div style={{
            background: "var(--surface-muted)",
            padding: "16px 32px",
            borderTop: "1px solid var(--line)",
            color: "var(--muted)",
            fontSize: "13px",
            textAlign: "center"
          }}>
            <p style={{ margin: 0 }}>
              💡 Check your spam folder if you don't see the email within a few minutes
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div style={{ textAlign: "center", marginTop: "40px", color: "var(--muted)", fontSize: "13px" }}>
          <p style={{ margin: 0 }}>
            Need immediate help? <Link href="/contact" style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>Contact our support</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "var(--bg)" }}></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
