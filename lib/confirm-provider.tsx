"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog";

interface ConfirmOptions {
  title: string;
  message: string;
  type?: "warning" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: Omit<ConfirmOptions, "showCancel" | "cancelText">) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options: { ...options, showCancel: options.showCancel ?? true },
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: Omit<ConfirmOptions, "showCancel" | "cancelText">): Promise<void> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options: { ...options, showCancel: false, confirmText: options.confirmText ?? "Oke" },
        resolve: () => resolve(),
      });
    });
  }, []);

  const handleConfirm = () => {
    if (dialogState) {
      dialogState.resolve(true);
      setDialogState(null);
    }
  };

  const handleCancel = () => {
    if (dialogState) {
      dialogState.resolve(false);
      setDialogState(null);
    }
  };

  const handleClose = () => {
    if (dialogState) {
      dialogState.resolve(false);
      setDialogState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {dialogState && (
        <CartoonConfirmDialog
          isOpen={dialogState.isOpen}
          type={dialogState.options.type || "warning"}
          title={dialogState.options.title}
          message={dialogState.options.message}
          confirmText={dialogState.options.confirmText}
          cancelText={dialogState.options.cancelText}
          showCancel={dialogState.options.showCancel}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onClose={handleClose}
        />
      )}
    </ConfirmContext.Provider>
  );
};
