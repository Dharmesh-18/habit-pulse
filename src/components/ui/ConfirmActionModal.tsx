// src/components/ui/ConfirmActionModal.tsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { NeuCard } from "./NeuCard";
import { NeuButton } from "./NeuButton";
import { BellOff, BellRing, X } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "danger" | "primary";
  isTurningOff?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  variant = "primary",
  isTurningOff = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
      onClick={() => !isLoading && onCancel()}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <NeuCard className="flex flex-col gap-5 relative shadow-2xl">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-neu-muted hover:text-neu-dark transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5 pr-6">
            <div className="w-11 h-11 rounded-2xl bg-neu-bg shadow-neu-flat-sm flex items-center justify-center shrink-0">
              {isTurningOff ? (
                <BellOff className="w-5 h-5 text-neu-danger" />
              ) : (
                <BellRing className="w-5 h-5 text-neu-accent" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-neu-dark">{title}</h3>
              <p className="text-xs text-neu-muted mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-black/5">
            <NeuButton
              type="button"
              size="sm"
              disabled={isLoading}
              onClick={onCancel}
            >
              Cancel
            </NeuButton>
            <NeuButton
              type="button"
              size="sm"
              variant={variant}
              disabled={isLoading}
              onClick={onConfirm}
            >
              {isLoading ? "Updating..." : confirmLabel}
            </NeuButton>
          </div>
        </NeuCard>
      </div>
    </div>,
    document.body,
  );
};