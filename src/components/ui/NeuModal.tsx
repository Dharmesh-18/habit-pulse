// src/components/ui/NeuModal.tsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface NeuModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const NeuModal: React.FC<NeuModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--theme-surface-elevated)",
          borderColor: "var(--theme-border)",
        }}
        className={cn(
          "w-full max-w-md rounded-3xl p-6 shadow-neu-flat border flex flex-col gap-5 animate-in zoom-in-95 duration-150 backdrop-blur-xl",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neu-dark tracking-tight">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neu-bg shadow-neu-flat-sm active:shadow-neu-pressed flex items-center justify-center text-neu-muted hover:text-neu-dark transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
};