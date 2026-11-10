import React from "react";
import { cn } from "../../lib/utils";

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const NeuInput: React.FC<NeuInputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-neu-muted tracking-wide uppercase px-1">{label}</label>}
      <input
        className={cn(
          "w-full bg-neu-bg px-4 py-2.5 rounded-xl text-neu-text placeholder:text-neu-muted/60 text-sm outline-none",
          "shadow-neu-pressed transition-all duration-200 focus:ring-1 focus:ring-neu-accent/40",
          error && "ring-1 ring-neu-danger",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-neu-danger px-1">{error}</span>}
    </div>
  );
};