// src/components/ui/NeuThemeSelect.tsx
import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  THEMES,
  getThemeMeta,
  isThemeUnlocked,
  type AppTheme,
} from "../../lib/themes";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { getTodayKey, cn } from "../../lib/utils";
import { ChevronDown, Check, Lock, Flame } from "lucide-react";

export const NeuThemeSelect: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sessionToken =
    typeof window !== "undefined" ? localStorage.getItem("habit_token") || "" : "";

  const overview = useQuery(
    api.achievements.index.listOverview,
    sessionToken ? { sessionToken, todayDate: getTodayKey() } : "skip"
  );

  const highestMilestone = overview?.highestUnlockedMilestone ?? 0;

  const activeTheme = getThemeMeta(theme);
  const ActiveIcon = activeTheme.icon;

  // Guard: if saved theme is locked once achievements load, fallback to "nova"
  useEffect(() => {
    if (overview === undefined) return;
    if (!isThemeUnlocked(activeTheme, highestMilestone)) {
      setTheme("nova");
    }
  }, [overview, activeTheme, highestMilestone, setTheme]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const starterThemes = THEMES.filter((t) => t.unlockRule.type === "free");
  const collectorThemes = THEMES.filter((t) => t.unlockRule.type !== "free");

  const handleSelect = (item: AppTheme, unlocked: boolean) => {
    if (!unlocked) {
      if (item.unlockRule.type === "streak") {
        toast.info(
          `Reach a ${item.unlockRule.minDays}-day streak on any habit to unlock "${item.label}"!`
        );
      }
      return;
    }
    setTheme(item.id);
    setIsOpen(false);
  };

  const renderThemeRow = (item: AppTheme) => {
    const Icon = item.icon;
    const isSelected = item.id === theme;
    const unlocked = isThemeUnlocked(item, highestMilestone);

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleSelect(item, unlocked)}
        className={cn(
          "flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left w-full",
          isSelected
            ? "shadow-neu-pressed text-neu-accent font-semibold"
            : unlocked
              ? "hover:bg-white/10 text-neu-text cursor-pointer"
              : "opacity-60 hover:opacity-80 text-neu-muted cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn("w-4 h-4 shrink-0", item.iconColor)} />
          <span className="truncate">{item.label}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 2-Dot Live Color Swatch (Bg + Accent) */}
          <div
            className="flex items-center -space-x-1"
            title={`${item.label} color palette`}
          >
            <span
              className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: item.swatch[0] }}
            />
            <span
              className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: item.swatch[1] }}
            />
          </div>

          {!unlocked && item.unlockRule.type === "streak" ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] font-bold text-amber-400">
              <Lock className="w-2.5 h-2.5" />
              {item.unlockRule.minDays}d
            </span>
          ) : isSelected ? (
            <Check className="w-3.5 h-3.5 text-neu-accent shrink-0" />
          ) : (
            <span className="w-3.5" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="relative z-40" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Switch App Theme"
        className={cn(
          "h-10 px-3 rounded-xl bg-neu-bg text-neu-text text-xs outline-none flex items-center gap-2",
          "shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed transition-all duration-200"
        )}
      >
        <ActiveIcon className={cn("w-4 h-4 shrink-0", activeTheme.iconColor)} />
        <span className="font-semibold text-neu-dark hidden sm:inline">
          {activeTheme.label}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-neu-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            backgroundColor: "var(--theme-surface-elevated)",
            borderColor: "var(--theme-border)",
          }}
          className="right-0 top-[calc(100%+8px)] w-60 max-h-[75vh] overflow-y-auto z-50 rounded-2xl shadow-neu-flat p-2 border flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl"
        >
          <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-neu-muted">
            Starter Themes
          </div>
          {starterThemes.map(renderThemeRow)}

          <div className="my-1 border-t border-white/10" />

          <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-amber-400" />
            <span>Streak Unlocks</span>
          </div>
          {collectorThemes.map(renderThemeRow)}
        </div>
      )}
    </div>
  );
};