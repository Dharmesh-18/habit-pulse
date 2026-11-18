// src/components/ui/FeatureBanner.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { LATEST_ANNOUNCEMENT } from "../../config/announcements";
import type { AppView } from "../layout/AppHeader";

const STORAGE_KEY_PREFIX = "habit_pulse_dismissed_banner_";

const VIEW_ROUTE_MAP: Record<AppView, string> = {
  dashboard: "/",
  achievements: "/achievements",
  leaderboard: "/leaderboard",
  profile: "/profile",
};

export const FeatureBanner: React.FC = () => {
  const navigate = useNavigate();
  const announcement = LATEST_ANNOUNCEMENT;

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (!announcement.isActive) return true;
    return (
      localStorage.getItem(`${STORAGE_KEY_PREFIX}${announcement.id}`) === "true"
    );
  });

  if (!announcement.isActive || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${announcement.id}`, "true");
    setIsDismissed(true);
  };

  const handleActionClick = () => {
    if (announcement.action) {
      const targetPath = VIEW_ROUTE_MAP[announcement.action.targetView] ?? "/";
      navigate(targetPath);
    }
  };

  return (
    <div
      role="region"
      aria-label="New feature announcement"
      className="relative overflow-hidden rounded-2xl bg-neu-bg shadow-neu-flat border border-neu-accent/20 px-4 py-3.5 sm:px-5 transition-all"
    >
      {/* Subtle left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-neu-accent" />

      <div className="flex items-start sm:items-center justify-between gap-3">
        {/* Icon + Text */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-center text-neu-accent shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-neu-accent/15 text-neu-accent">
                {announcement.badge}
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-neu-dark truncate">
                {announcement.title}
              </h3>
            </div>

            <span className="hidden sm:inline text-neu-muted/40">•</span>

            <p className="text-xs text-neu-muted leading-relaxed line-clamp-2 sm:line-clamp-1">
              {announcement.description}
            </p>
          </div>
        </div>

        {/* Action CTA + Dismiss Button */}
        <div className="flex items-center gap-2 shrink-0">
          {announcement.action && (
            <button
              type="button"
              onClick={handleActionClick}
              className="hidden md:inline-flex items-center gap-1 text-xs font-bold text-neu-accent hover:opacity-80 px-2.5 py-1.5 rounded-xl bg-neu-bg shadow-neu-flat-sm active:shadow-neu-pressed-sm transition-all cursor-pointer"
            >
              <span>{announcement.action.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            title="Dismiss"
            className="p-1.5 rounded-xl text-neu-muted hover:text-neu-dark hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Action Link (Cleanly stacked on small screens) */}
      {announcement.action && (
        <div className="mt-2.5 pl-12 md:hidden">
          <button
            type="button"
            onClick={handleActionClick}
            className="inline-flex items-center gap-1 text-xs font-bold text-neu-accent hover:underline"
          >
            <span>{announcement.action.label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};