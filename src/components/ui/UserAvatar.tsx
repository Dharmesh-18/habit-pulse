// src/components/ui/UserAvatar.tsx
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";

interface UserAvatarProps {
  name: string;
  avatarStorageId?: Id<"_storage">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarStorageId,
  size = "md",
  className,
  onClick,
}) => {
  const avatarUrl = useQuery(
    api.storage.index.getImageUrl,
    avatarStorageId ? { storageId: avatarStorageId } : "skip"
  );

  const initial = (name.trim()[0] || "U").toUpperCase();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl font-bold",
    xl: "w-24 h-24 text-3xl font-extrabold",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-full bg-neu-bg flex items-center justify-center overflow-hidden transition-all duration-200 outline-none select-none",
        onClick ? "shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed cursor-pointer" : "shadow-neu-flat",
        sizeClasses[size],
        className
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-neu-accent font-bold tracking-tight">
          {initial}
        </span>
      )}
    </Component>
  );
};