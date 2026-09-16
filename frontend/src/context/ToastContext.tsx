"use client";

import React, {
createContext,
useContext,
useState,
useCallback,
} from "react";

interface Toast {
id: string;
message: string;
type: "success" | "error" | "info" | "warning";
duration?: number;
}

interface ToastContextType {
showToast: (
message: string,
type?: Toast["type"],
duration?: number
) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({
children,
}: {
children: React.ReactNode;
}) {
const [toasts, setToasts] = useState<Toast[]>([]);

const showToast = useCallback(
(
message: string,
type: Toast["type"] = "success",
duration: number = 3000
) => {
const id = Math.random().toString(36).substring(7);


  const newToast: Toast = {
    id,
    message,
    type,
    duration,
  };

  setToasts((prev) => [...prev, newToast]);

  setTimeout(() => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }, duration);
},
[]


);

const removeToast = (id: string) => {
setToasts((prev) =>
prev.filter((toast) => toast.id !== id)
);
};

return (
<ToastContext.Provider value={{ showToast }}>
{children}


  {/* Toast Container */}
  <div
    className="toast-container"
    style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      maxWidth: "400px",
    }}
  >
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className="toast-item"
        style={{
          background: "#ffffff",
          color:
            toast.type === "success"
              ? "#2d5016"
              : toast.type === "error"
              ? "#dc3545"
              : toast.type === "warning"
              ? "#856404"
              : "#17a2b8",
          padding: "16px 20px",
          borderRadius: "12px",
          boxShadow:
            "rgba(0, 0, 0, 2.15) 0px 2px 10px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minWidth: "300px",
          animation:
            "slideInRight 0.3s ease-out, fadeOut 0.3s ease-out " +
            ((toast.duration || 3000) - 300) +
            "ms forwards",
          position: "relative",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        {/* Progress Bar */}
        <div
          className="toast-progress-bar"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "3px",
            background:
              toast.type === "success"
                ? "#2d5016"
                : toast.type === "error"
                ? "#dc3545"
                : toast.type === "warning"
                ? "#ffc107"
                : "#17a2b8",
            animation: `shrink ${
              toast.duration || 3000
            }ms linear forwards`,
            width: "100%",
            opacity: 0.3,
            zIndex: 1,
          }}
        />

        {/* Icon */}
        <div
          className="toast-icon"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background:
              toast.type === "success"
                ? "#2d5016"
                : toast.type === "error"
                ? "#dc3545"
                : toast.type === "warning"
                ? "#ffc107"
                : "#17a2b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative",
            zIndex: 2,
          }}
        >
          {toast.type === "success" && (
            <i
              className="fal fa-check"
              style={{
                fontSize: "20px",
                color: "#ffffff",
              }}
            />
          )}

          {toast.type === "error" && (
            <i
              className="fal fa-times"
              style={{
                fontSize: "20px",
                color: "#ffffff",
              }}
            />
          )}

          {toast.type === "warning" && (
            <i
              className="fal fa-exclamation"
              style={{
                fontSize: "20px",
                color: "#ffffff",
              }}
            />
          )}

          {toast.type === "info" && (
            <i
              className="fal fa-info"
              style={{
                fontSize: "20px",
                color: "#ffffff",
              }}
            />
          )}
        </div>

        {/* Message */}
        <div
          className="toast-message"
          style={{
            flex: 1,
            fontSize: "14px",
            fontWeight: "600",
            position: "relative",
            zIndex: 2,
          }}
        >
          {toast.message}
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            removeToast(toast.id);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            removeToast(toast.id);
          }}
          style={{
            background: "rgba(0, 0, 0, 0.05)",
            border: "none",
            color:
              toast.type === "success"
                ? "#2d5016"
                : toast.type === "error"
                ? "#dc3545"
                : toast.type === "warning"
                ? "#856404"
                : "#17a2b8",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
            transition: "background 0.2s",
            position: "relative",
            zIndex: 10,
            WebkitTapHighlightColor:
              "transparent",
            touchAction: "manipulation",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background =
              "rgba(0, 0, 0, 0.1)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              "rgba(0, 0, 0, 0.05)")
          }
          aria-label="Close notification"
          type="button"
        >
          ×
        </button>
      </div>
    ))}
  </div>

  {/* Animations and Responsive Styles */}
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

    /* =========================================
       MOBILE
       ========================================= */

    @media (max-width: 768px) {
      .toast-container {
        top: 10px !important;
        right: 10px !important;
        left: auto !important;

        /*
         * Important:
         * Do not make the toast 100% width.
         */
        width: auto !important;
        max-width: calc(100vw - 20px) !important;
      }

      .toast-item {
        /*
         * Compact mobile toast
         */
        min-width: 0 !important;
        width: auto !important;
        max-width: 280px !important;

        padding: 9px 11px !important;
        gap: 8px !important;

        border-radius: 9px !important;

        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }

      /* Smaller Icon */
      .toast-icon {
        width: 30px !important;
        height: 30px !important;
        min-width: 30px !important;
      }

      .toast-icon i {
        font-size: 14px !important;
      }

      /* Smaller Message */
      .toast-message {
        font-size: 12px !important;
        line-height: 16px !important;
        font-weight: 600 !important;

        max-width: 190px !important;
        word-break: break-word !important;
      }

      /* Smaller Close Button */
      .toast-item button {
        width: 25px !important;
        height: 25px !important;
        min-width: 25px !important;
        min-height: 25px !important;

        font-size: 17px !important;

        margin-left: 2px !important;
        padding: 0 !important;
      }

      /*
       * Hide progress bar on mobile
       * to keep the compact design clean.
       */
      .toast-progress-bar {
        display: none !important;
      }
    }

    /* =========================================
       VERY SMALL MOBILE
       ========================================= */

    @media (max-width: 400px) {
      .toast-container {
        right: 8px !important;
        top: 8px !important;
        max-width: calc(100vw - 16px) !important;
      }

      .toast-item {
        max-width: 245px !important;

        padding: 8px 9px !important;
        gap: 7px !important;
      }

      /* Smaller Icon */
      .toast-icon {
        width: 27px !important;
        height: 27px !important;
        min-width: 27px !important;
      }

      .toast-icon i {
        font-size: 13px !important;
      }

      /* Smaller Message */
      .toast-message {
        font-size: 11px !important;
        line-height: 15px !important;
        max-width: 165px !important;
      }

      /* Smaller Close Button */
      .toast-item button {
        width: 23px !important;
        height: 23px !important;
        min-width: 23px !important;
        min-height: 23px !important;

        font-size: 16px !important;
      }
    }

    /* =========================================
       TABLET
       ========================================= */

    @media (min-width: 769px) and (max-width: 1024px) {
      .toast-container {
        max-width: 350px !important;
        top: 15px !important;
        right: 15px !important;
      }

      .toast-item {
        min-width: 280px !important;
        padding: 14px 18px !important;
      }
    }
  `}</style>
</ToastContext.Provider>


);
}

export function useToast() {
const context = useContext(ToastContext);

if (context === undefined) {
throw new Error(
"useToast must be used within a ToastProvider"
);
}

return context;
}
