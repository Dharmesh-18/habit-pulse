// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, "error"), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}

      {createPortal(
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 pointer-events-none max-w-sm w-full px-4">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                backgroundColor: "var(--theme-surface-elevated)",
                borderColor: "var(--theme-border)",
              }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-neu-flat transition-all duration-300 transform",
                "border w-full animate-in fade-in slide-in-from-top-3 backdrop-blur-xl"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                {toast.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                )}
                {toast.type === "info" && (
                  <Info className="w-5 h-5 text-indigo-500" />
                )}
              </div>

              <div className="flex-1 text-sm font-medium text-neu-dark leading-snug break-words">
                {toast.message}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-neu-muted hover:text-neu-dark transition-colors p-1 -mr-1 -mt-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};