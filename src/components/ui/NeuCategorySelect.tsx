// src/components/ui/NeuCategorySelect.tsx
import React, { useState, useRef, useEffect } from "react";
import { CATEGORIES, getCategoryMeta, type HabitCategory } from "../../lib/categories";
import { ChevronDown } from "lucide-react";
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
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-neu-muted tracking-wide uppercase px-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-neu-bg px-3.5 py-2.5 rounded-xl text-neu-text text-sm outline-none flex items-center justify-between",
          "shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed transition-all duration-200"
        )}
      >
        <div className="flex items-center gap-2">
          <SelectedIcon className={cn("w-4 h-4 shrink-0", selectedCategory.color)} />
          <span className="font-medium text-neu-dark text-xs">{selectedCategory.label}</span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-neu-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[105%] left-0 w-full z-30 bg-neu-bg rounded-xl shadow-neu-flat p-1.5 border border-white/60 flex flex-col gap-1 animate-in fade-in">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isCurrent = cat.id.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.label);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left w-full",
                  isCurrent
                    ? "shadow-neu-pressed text-neu-accent bg-neu-bg font-semibold"
                    : "hover:bg-black/5 text-neu-text"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", cat.color)} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};