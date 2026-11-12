// src/components/ui/NeuCategorySelect.tsx
import React, { useState, useRef, useEffect } from "react";
import { CATEGORIES, getCategoryMeta, type HabitCategory } from "../../lib/categories";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface NeuCategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  label?: string;
}

export const NeuCategorySelect: React.FC<NeuCategorySelectProps> = ({
  value,
  onChange,
  label = "Category",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCategory: HabitCategory = getCategoryMeta(value);
  const SelectedIcon = selectedCategory.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 w-full relative z-30" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-neu-muted tracking-wide uppercase px-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full bg-neu-bg px-3.5 py-2.5 rounded-xl text-neu-text text-sm outline-none flex items-center justify-between",
          "shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed transition-all duration-200"
        )}
      >
        <div className="flex items-center gap-2">
          <SelectedIcon className={cn("w-4 h-4 shrink-0", selectedCategory.color)} />
          <span className="font-medium text-neu-dark text-xs">{selectedCategory.label}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-neu-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            backgroundColor: "var(--theme-surface-elevated)",
            borderColor: "var(--theme-border)",
          }}
          className="top-[calc(100%+6px)] left-0 w-full z-50 rounded-2xl shadow-neu-flat p-1.5 border flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isCurrent =
              cat.id.toLowerCase() === value.toLowerCase() ||
              cat.label.toLowerCase() === value.toLowerCase();

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.label);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left w-full",
                  isCurrent
                    ? "shadow-neu-pressed text-neu-accent font-semibold"
                    : "hover:bg-white/10 text-neu-text"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4 shrink-0", cat.color)} />
                  <span>{cat.label}</span>
                </div>
                {isCurrent && <Check className="w-3.5 h-3.5 text-neu-accent shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};