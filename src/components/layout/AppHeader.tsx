// src/components/layout/AppHeader.tsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Flame, Download, Zap } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { NeuButton } from "../ui/NeuButton";
import { NeuThemeSelect } from "../ui/NeuThemeSelect";
import { UserAvatar } from "../ui/UserAvatar";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import type { Id } from "../../../convex/_generated/dataModel";
import { WalletBadge, formatCompactStat } from "./WalletBadge";

export type AppView =
  "dashboard" | "achievements" | "leaderboard" | "profile" | "shop";

interface AppHeaderProps {
  userName: string;
  avatarStorageId?: Id<"_storage">;
  sessionToken: string;
  presetAvatarId?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  avatarStorageId,
  sessionToken,
  presetAvatarId,
}) => {
  const { canInstall, promptInstall } = usePWAInstall();
  const navigate = useNavigate();
  const location = useLocation();
  const isProfile = location.pathname === "/profile";

  const effectiveToken =
    sessionToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("habit_token") || ""
      : "");

  const wallet = useQuery(
    api.shop.index.getMyWallet,
    effectiveToken ? { sessionToken: effectiveToken } : "skip",
  );
  const xp = wallet?.xp ?? 0;

  return (
    <header className="sticky top-0 z-40 w-full bg-neu-bg/90 backdrop-blur-md border-b border-black/5">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand + Greeting */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            onClick={() => navigate("/")}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent shrink-0 cursor-pointer active:shadow-neu-pressed transition-all"
          >
            <Flame className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h1
              onClick={() => navigate("/")}
              className="text-sm sm:text-lg font-bold text-neu-dark cursor-pointer hover:text-neu-accent transition-colors truncate"
            >
              Habit Pulse
            </h1>
            <p className="text-[11px] sm:text-xs text-neu-muted truncate">
              Welcome, {userName.split(" ")[0]}!
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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

          <WalletBadge sessionToken={sessionToken} />

          <NeuThemeSelect />

          {/* User Avatar with Bottom-Right XP Badge */}
          <div
            onClick={() => navigate(isProfile ? "/" : "/profile")}
            title={`${userName} • ${xp.toLocaleString()} Total XP`}
            className="relative cursor-pointer shrink-0 pb-1"
          >
            <UserAvatar
              name={userName}
              avatarStorageId={avatarStorageId}
              presetAvatarId={presetAvatarId}
              size="md"
              className={isProfile ? "ring-2 ring-neu-accent" : ""}
            />
            <span className="absolute -bottom-0.5 -right-1 px-1.5 py-0.5 rounded-full bg-neu-accent text-white text-[9px] font-extrabold leading-none shadow-sm ring-2 ring-neu-bg flex items-center gap-0.5 tabular-nums pointer-events-none">
              <Zap className="w-2 h-2 fill-current shrink-0" />
              <span>{formatCompactStat(xp)}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
