// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { cn } from "../lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message }]);

      // 5-second automatic dismiss
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const success = useCallback((msg: string) => showToast(msg, "success"), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, "error"), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, "info"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}

      {/* Floating Neumorphic Toast Stack */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-neu-bg shadow-neu-flat transition-all duration-300 transform translate-y-0",
              "border border-white/60 animate-in fade-in slide-in-from-top-3"
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
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};