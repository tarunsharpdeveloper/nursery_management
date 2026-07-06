"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast["type"], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success", duration: number = 3000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "400px"
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: "#ffffff",
              color: 
                toast.type === "success" ? "#2d5016" :
                toast.type === "error" ? "#dc3545" :
                toast.type === "warning" ? "#856404" :
                "#17a2b8",
              padding: "16px 20px",
              borderRadius: "12px",
              boxShadow: "rgba(0, 0, 0, 2.15) 0px 2px 10px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minWidth: "300px",
              animation: "slideInRight 0.3s ease-out, fadeOut 0.3s ease-out " + ((toast.duration || 3000) - 300) + "ms forwards",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              // border: `2px solid ${
              //   toast.type === "success" ? "#2d5016" :
              //   toast.type === "error" ? "#dc3545" :
              //   toast.type === "warning" ? "#ffc107" :
              //   "#17a2b8"
              // }`
            }}
            onClick={() => removeToast(toast.id)}
          >
            {/* Progress bar */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: "3px",
              background: 
                toast.type === "success" ? "#2d5016" :
                toast.type === "error" ? "#dc3545" :
                toast.type === "warning" ? "#ffc107" :
                "#17a2b8",
              animation: `shrink ${toast.duration || 3000}ms linear forwards`,
              width: "100%",
              opacity: 0.3
            }} />
            
            {/* Icon */}
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: 
                toast.type === "success" ? "#2d5016" :
                toast.type === "error" ? "#dc3545" :
                toast.type === "warning" ? "#ffc107" :
                "#17a2b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              {toast.type === "success" && (
                <i className="fal fa-check" style={{ fontSize: "20px", color: "#ffffff" }}></i>
              )}
              {toast.type === "error" && (
                <i className="fal fa-times" style={{ fontSize: "20px", color: "#ffffff" }}></i>
              )}
              {toast.type === "warning" && (
                <i className="fal fa-exclamation" style={{ fontSize: "20px", color: "#ffffff" }}></i>
              )}
              {toast.type === "info" && (
                <i className="fal fa-info" style={{ fontSize: "20px", color: "#ffffff" }}></i>
              )}
            </div>

            {/* Message */}
            <div style={{ flex: 1, fontSize: "14px", fontWeight: "600" }}>
              {toast.message}
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "none",
                color: 
                  toast.type === "success" ? "#2d5016" :
                  toast.type === "error" ? "#dc3545" :
                  toast.type === "warning" ? "#856404" :
                  "#17a2b8",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0, 0, 0, 0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0, 0, 0, 0.05)"}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
