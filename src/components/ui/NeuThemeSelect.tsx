// src/components/ui/NeuThemeSelect.tsx
import React, { useState, useRef, useEffect } from "react";
import { THEMES, getThemeMeta } from "../../lib/themes";
import { useTheme } from "../../context/ThemeContext";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export const NeuThemeSelect: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme = getThemeMeta(theme);
  const ActiveIcon = activeTheme.icon;

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

      {/* Dropdown Menu - Strictly isolated floating layer */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            backgroundColor: "var(--theme-surface-elevated)",
            borderColor: "var(--theme-border)",
          }}
          className="right-0 top-[calc(100%+8px)] w-44 z-50 rounded-2xl shadow-neu-flat p-1.5 border flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neu-muted">
            Select Theme
          </div>

          {THEMES.map((item) => {
            const Icon = item.icon;
            const isSelected = item.id === theme;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTheme(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left w-full",
                  isSelected
                    ? "shadow-neu-pressed text-neu-accent font-semibold"
                    : "hover:bg-white/10 text-neu-text"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4 shrink-0", item.iconColor)} />
                  <span>{item.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-neu-accent shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};