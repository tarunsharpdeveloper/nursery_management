"use client";

import { X, AlertTriangle } from "lucide-react";

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 450, padding: 24 }}>
        <button 
          type="button" 
          onClick={onCancel} 
          className="modal-close-btn"
          disabled={isLoading}
        >
          <X size={24} />
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {isDestructive ? (
            <div style={{ background: '#fef2f2', padding: 12, borderRadius: '50%', marginBottom: 16 }}>
              <AlertTriangle size={32} color="#ef4444" />
            </div>
          ) : (
            <div style={{ background: '#f0fdf4', padding: 12, borderRadius: '50%', marginBottom: 16 }}>
              <AlertTriangle size={32} color="#22c55e" />
            </div>
          )}
          
          <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: '1.25rem' }}>{title}</h3>
          <p style={{ color: '#52525b', marginBottom: 24, fontSize: '0.95rem', lineHeight: 1.5 }}>
            {message}
          </p>
          
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button 
              className="button secondary" 
              style={{ flex: 1 }} 
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button 
              className="button" 
              style={{ 
                flex: 1, 
                backgroundColor: isDestructive ? '#ef4444' : undefined,
                borderColor: isDestructive ? '#ef4444' : undefined
              }} 
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
