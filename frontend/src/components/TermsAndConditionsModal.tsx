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
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
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
          width: "92%",
          borderRadius: "18px",
          padding: "0",
          overflow: "hidden",
          border: "1px solid rgba(45, 80, 22, 0.15)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          background: "#ffffff",
          animation: "modalFadeIn 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a10 0%, #2d5016 100%)",
            color: "#ffffff",
            padding: "24px 28px",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
            title="Close"
          >
            <X size={18} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "rgba(140, 198, 63, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8cc63f",
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "18px", fontWeight: "700", letterSpacing: "-0.3px" }}>
                {config.title}
              </h3>
              {amount !== undefined && amount > 0 && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "2px",
                    fontSize: "13px",
                    color: "#8cc63f",
                    fontWeight: "600",
                  }}
                >
                  Payable Amount: ₹{amount.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <p style={{ margin: "6px 0 0 0", color: "#d1e7dd", fontSize: "13px", lineHeight: "1.5" }}>
            {config.subtitle}
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px 28px", backgroundColor: "#fafdf8" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "22px",
              maxHeight: "300px",
              overflowY: "auto",
              paddingRight: "6px",
            }}
          >
            {config.points.map((point, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  background: "#ffffff",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #e8f3e5",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#e8f5e3",
                    color: "#2d5016",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "700",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  {index + 1}
                </div>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#334155", lineHeight: "1.5" }}>
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
              borderRadius: "12px",
              padding: "14px 16px",
              transition: "all 0.2s ease",
            }}
          >
            <label
              htmlFor="tc-checkbox"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
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
                  fontSize: "14px",
                  fontWeight: "600",
                  color: isChecked ? "#166534" : "#1e293b",
                  lineHeight: "1.4",
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
            padding: "16px 28px",
            backgroundColor: "#ffffff",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="vs-btn style2"
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#475569",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {config.cancelButtonText}
          </button>

          <button
            type="button"
            onClick={handleAcceptClick}
            disabled={!isChecked || isLoading}
            style={{
              padding: "10px 24px",
              fontSize: "14px",
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
              gap: "8px",
              transition: "all 0.2s ease",
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
      `}</style>
    </div>
  );
}

export default TermsAndConditionsModal;
