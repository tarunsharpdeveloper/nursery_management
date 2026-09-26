"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, CheckCircle2, Lock } from "lucide-react";
import { PAYMENT_TERMS_AND_CONDITIONS, PaymentTermsConfig } from "@/constants/paymentTerms";

export interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  amount?: number;
  config?: PaymentTermsConfig;
}

export function TermsAndConditionsModal({
  isOpen,
  onAccept,
  onCancel,
  isLoading = false,
  amount,
  config = PAYMENT_TERMS_AND_CONDITIONS,
}: TermsAndConditionsModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  // Reset checkbox when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  const handleAcceptClick = () => {
    if (isChecked && !isLoading) {
      onAccept();
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 9999,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        padding: "clamp(12px, 3vw, 20px)",
        overflow: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: "560px",
          width: "clamp(85%, 92%, 560px)",
          maxHeight: "clamp(70vh, 75vh, 80vh)",
          display: "flex",
          flexDirection: "column",
          borderRadius: "18px",
          padding: "0",
          overflow: "hidden",
          border: "1px solid rgba(45, 80, 22, 0.15)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          background: "#ffffff",
          animation: "modalFadeIn 0.25s ease-out",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a10 0%, #2d5016 100%)",
            color: "#ffffff",
            padding: "clamp(14px, 3vw, 18px) clamp(14px, 3vw, 20px)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              position: "absolute",
              top: "clamp(10px, 2.5vw, 16px)",
              right: "clamp(10px, 2.5vw, 16px)",
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              borderRadius: "50%",
              width: "clamp(26px, 6vw, 30px)",
              height: "clamp(26px, 6vw, 30px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
            title="Close"
          >
            <X size={16} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 10px)", marginBottom: "6px" }}>
            <div
              style={{
                width: "clamp(28px, 6vw, 34px)",
                height: "clamp(28px, 6vw, 34px)",
                borderRadius: "8px",
                backgroundColor: "rgba(140, 198, 63, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8cc63f",
              }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "clamp(13px, 3.5vw, 15px)", fontWeight: "700", letterSpacing: "-0.3px" }}>
                {config.title}
              </h3>
              {amount !== undefined && amount > 0 && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "2px",
                    fontSize: "clamp(10px, 2.2vw, 12px)",
                    color: "#8cc63f",
                    fontWeight: "600",
                  }}
                >
                  Payable Amount: ₹{amount.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#d1e7dd", fontSize: "clamp(11px, 2.2vw, 12px)", lineHeight: "1.4" }}>
            {config.subtitle}
          </p>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: "clamp(10px, 2.5vw, 12px) clamp(12px, 2.5vw, 16px)",
            backgroundColor: "#fafdf8",
            flex: "1 1 auto",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginBottom: "10px",
            }}
          >
            {config.points.map((point, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "clamp(6px, 1.5vw, 8px)",
                  alignItems: "flex-start",
                  background: "#ffffff",
                  padding: "clamp(6px, 1.5vw, 8px) clamp(6px, 1.5vw, 10px)",
                  borderRadius: "6px",
                  border: "1px solid #e8f3e5",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "#e8f5e3",
                    color: "#2d5016",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: "700",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  {index + 1}
                </div>
                <p style={{ margin: 0, fontSize: "clamp(11px, 2.3vw, 13px)", color: "#334155", lineHeight: "1.4" }}>
                  {point}
                </p>
              </div>
            ))}
          </div>

          {/* Mandatory Checkbox Box */}
          <div
            style={{
              background: isChecked ? "#f0fdf4" : "#ffffff",
              border: isChecked ? "2px solid #22c55e" : "2px solid #cbd5e1",
              borderRadius: "8px",
              padding: "clamp(8px, 2vw, 10px) clamp(8px, 2vw, 12px)",
              transition: "all 0.2s ease",
            }}
          >
            <label
              htmlFor="tc-checkbox"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(8px, 2vw, 12px)",
                cursor: "pointer",
                userSelect: "none",
                margin: 0,
              }}
            >
              <input
                type="checkbox"
                id="tc-checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                disabled={isLoading}
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#2d5016",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  borderRadius: "4px",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "clamp(12px, 2.3vw, 13px)",
                  fontWeight: "600",
                  color: isChecked ? "#166534" : "#1e293b",
                  lineHeight: "1.3",
                }}
              >
                {config.checkboxLabel}
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "clamp(10px, 2.5vw, 14px) clamp(10px, 2.5vw, 18px)",
            backgroundColor: "#ffffff",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "center",
            gap: "clamp(6px, 1.5vw, 10px)",
            flexShrink: 0,
            flexWrap: "wrap",
            rowGap: "clamp(8px, 2vw, 10px)",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="vs-btn style2"
            style={{
              padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)",
              fontSize: "clamp(11px, 2.2vw, 13px)",
              fontWeight: "600",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#475569",
              cursor: isLoading ? "not-allowed" : "pointer",
              flex: "1 1 auto",
              minWidth: "clamp(75px, 30%, 110px)",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            {config.cancelButtonText}
          </button>

          <button
            type="button"
            onClick={handleAcceptClick}
            disabled={!isChecked || isLoading}
            style={{
              padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 18px)",
              fontSize: "clamp(11px, 2.2vw, 13px)",
              fontWeight: "700",
              borderRadius: "8px",
              border: "none",
              background: isChecked && !isLoading
                ? "linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%)"
                : "#cbd5e1",
              color: isChecked && !isLoading ? "#ffffff" : "#94a3b8",
              cursor: isChecked && !isLoading ? "pointer" : "not-allowed",
              boxShadow: isChecked && !isLoading
                ? "0 4px 12px rgba(45, 80, 22, 0.25)"
                : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(4px, 1vw, 6px)",
              transition: "all 0.2s ease",
              flex: "1 1 auto",
              minWidth: "clamp(90px, 35%, 120px)",
              whiteSpace: "nowrap",
            }}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: "4px" }}></i>
                Processing...
              </>
            ) : (
              <>
                <Lock size={16} />
                {config.acceptButtonText}
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95% !important;
            max-height: 90vh !important;
            border-radius: 14px !important;
          }
        }

        @media (max-width: 480px) {
          .modal-content {
            width: 96% !important;
            max-height: 92vh !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default TermsAndConditionsModal;
