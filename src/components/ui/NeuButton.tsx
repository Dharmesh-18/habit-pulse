import React from "react";
import { cn } from "../../lib/utils";

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isActive?: boolean;
}

export const NeuButton: React.FC<NeuButtonProps> = ({
  children,
  variant = "secondary",
  size = "md",
  isActive = false,
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-7 py-3 text-base rounded-2xl",
  };

  const variantClasses = {
    secondary: "text-neu-text hover:text-neu-dark",
    primary: "text-neu-accent font-semibold",
    danger: "text-neu-danger font-semibold",
  };

  return (
    <button
      className={cn(
        "bg-neu-bg font-medium transition-all duration-200 outline-none select-none",
        "active:shadow-neu-pressed",
        isActive ? "shadow-neu-pressed text-neu-accent" : "shadow-neu-flat hover:shadow-neu-flat-lg",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};