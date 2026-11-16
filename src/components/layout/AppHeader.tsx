// src/components/layout/AppHeader.tsx
import React from "react";
import { Flame, LogOut, Download } from "lucide-react";
import { NeuButton } from "../ui/NeuButton";
import { NeuThemeSelect } from "../ui/NeuThemeSelect";
import { UserAvatar } from "../ui/UserAvatar";
import { usePWAInstall } from "../../hooks/usePWAInstall";
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
  const { canInstall, promptInstall } = usePWAInstall();

  return (
    <header className="flex items-center justify-between gap-2 sm:gap-4">
      {/* Brand + Greeting */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div
          onClick={() => onNavigate("dashboard")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent shrink-0 cursor-pointer active:shadow-neu-pressed transition-all"
        >
          <Flame className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <h1
            onClick={() => onNavigate("dashboard")}
            className="text-base sm:text-lg font-bold text-neu-dark cursor-pointer hover:text-neu-accent transition-colors truncate"
          >
            Habit Pulse
          </h1>
          <p className="text-[11px] sm:text-xs text-neu-muted truncate">
            Welcome, {userName}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {canInstall && (
          <NeuButton
            size="sm"
            variant="primary"
            onClick={promptInstall}
            title="Install Habit Pulse App"
            className="flex items-center gap-1.5 px-2.5 sm:px-3"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </NeuButton>
        )}

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
          title="Logout"
          className="flex items-center gap-1.5 px-2.5 sm:px-3"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </NeuButton>
      </div>
    </header>
  );
};