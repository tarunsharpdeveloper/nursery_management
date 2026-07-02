"use client";

import { X } from "lucide-react";
import React from "react";

export type FormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number | string;
};

export function FormModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  maxWidth = 800 
}: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content form-modal-content" style={{ maxWidth }}>
        <div className="modal-header">
          <h4>{title}</h4>
          <button 
            type="button" 
            onClick={onClose} 
            className="modal-close-icon"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
