// src/components/layout/AppHeader.tsx
import React from "react";
import { Flame, LogOut } from "lucide-react";
import { NeuButton } from "../ui/NeuButton";
import { NeuThemeSelect } from "../ui/NeuThemeSelect";
import { UserAvatar } from "../ui/UserAvatar";
import type { Id } from "../../../convex/_generated/dataModel";

export type AppView = "dashboard" | "profile";

interface AppHeaderProps {
  userName: string;
  avatarStorageId?: Id<"_storage">;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  avatarStorageId,
  currentView,
  onNavigate,
  onLogout,
}) => {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          onClick={() => onNavigate("dashboard")}
          className="w-10 h-10 rounded-xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent cursor-pointer active:shadow-neu-pressed transition-all"
        >
          <Flame className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1
            onClick={() => onNavigate("dashboard")}
            className="text-lg font-bold text-neu-dark cursor-pointer hover:text-neu-accent transition-colors"
          >
            Habit Pulse
          </h1>
          <p className="text-xs text-neu-muted">Welcome back, {userName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NeuThemeSelect />

        <UserAvatar
          name={userName}
          avatarStorageId={avatarStorageId}
          size="md"
          onClick={() =>
            onNavigate(currentView === "profile" ? "dashboard" : "profile")
          }
          className={currentView === "profile" ? "ring-2 ring-neu-accent" : ""}
        />

        <NeuButton
          size="sm"
          onClick={onLogout}
          className="flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit</span>
        </NeuButton>
      </div>
    </header>
  );
};