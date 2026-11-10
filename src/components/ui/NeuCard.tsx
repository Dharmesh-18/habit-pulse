import React from "react";
import { cn } from "../../lib/utils";

interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export const NeuCard: React.FC<NeuCardProps> = ({ children, inset = false, className, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-2xl bg-neu-bg p-6 transition-all duration-300",
        inset ? "shadow-neu-pressed" : "shadow-neu-flat",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};