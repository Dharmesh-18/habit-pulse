// src/components/ui/UserAvatar.tsx
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";

interface UserAvatarProps {
  name: string;
  avatarStorageId?: Id<"_storage">;
  presetAvatarId?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

function resolvePresetAvatarUrl(presetAvatarId?: string): string | null {
  if (!presetAvatarId) return null;
  // "avatar-coco" -> "/avatars/coco.svg"
  const slug = presetAvatarId.replace(/^avatar-/, "");
  return `/avatars/${slug}.svg`;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarStorageId,
  presetAvatarId,
  size = "md",
  className,
  onClick,
}) => {
  const uploadedAvatarUrl = useQuery(
    api.storage.index.getImageUrl,
    avatarStorageId ? { storageId: avatarStorageId } : "skip"
  );

  const displayUrl = uploadedAvatarUrl || resolvePresetAvatarUrl(presetAvatarId);
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
        onClick
          ? "shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed cursor-pointer"
          : "shadow-neu-flat",
        sizeClasses[size],
        className
      )}
    >
      {displayUrl ? (
        <img
          src={displayUrl}
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