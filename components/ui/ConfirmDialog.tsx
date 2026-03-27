"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

type ConfirmationType = "warning" | "info" | "success";

interface CartoonConfirmDialogProps {
  type: ConfirmationType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  showCancel?: boolean;
}

const CartoonConfirmDialog = ({
  type,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  isOpen: externalIsOpen,
  onClose,
  showCancel = true,
}: CartoonConfirmDialogProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(externalIsOpen !== false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const typeStyles = {
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      icon: AlertCircle,
      iconColor: "text-amber-600",
      accentColor: "bg-amber-500",
      buttonColor: "bg-amber-500 hover:bg-amber-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      icon: Info,
      iconColor: "text-blue-600",
      accentColor: "bg-blue-500",
      buttonColor: "bg-blue-500 hover:bg-blue-600",
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      accentColor: "bg-emerald-500",
      buttonColor: "bg-emerald-500 hover:bg-emerald-600",
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
    setInternalIsOpen(false);
    onClose?.();
  };

  const handleCancel = () => {
    setInternalIsOpen(false);
    onCancel?.();
    onClose?.();
  };

  if (!isOpen) return null;

  const dialogContent = (
    <>
      {/* Backdrop - Full screen blur */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
        <div
          className={`
            ${style.bg} border-slate-200
            rounded-2xl border-2 p-6 shadow-[0_8px_0_0_rgba(0,0,0,0.1)]
            relative overflow-hidden
            animate-in fade-in zoom-in duration-200
            max-w-sm w-full
          `}
        >
          <div className="relative">
            {/* Icon Group */}
            <div className={`w-12 h-12 rounded-xl border-2 ${style.bg} ${style.border} flex items-center justify-center ${style.iconColor} mb-6 shadow-sm`}>
              <Icon size={24} strokeWidth={2.5} />
            </div>

            {/* Content */}
            <div className="space-y-1 mb-8">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{title}</h2>
              <p className="text-slate-500 font-bold text-xs leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {showCancel && (
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="
                    flex-1 h-12 rounded-xl font-bold text-sm
                    bg-white text-slate-600
                    disabled:opacity-50
                    transition-all
                    border-2 border-slate-200
                    shadow-[0_4px_0_0_#e2e8f0]
                    hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#e2e8f0]
                    active:translate-y-0.5 active:shadow-none
                  "
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`
                  flex-1 h-12 rounded-xl font-bold text-sm text-white
                  ${style.buttonColor}
                  disabled:opacity-50
                  transition-all
                  border-2 border-black/10
                  shadow-[0_4px_0_0_rgba(0,0,0,0.1)]
                  hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_rgba(0,0,0,0.1)]
                  active:translate-y-0.5 active:shadow-none
                `}
              >
                {isLoading ? "Memproses..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (!isMounted) return null;

  return createPortal(dialogContent, document.body);
};

export default CartoonConfirmDialog;