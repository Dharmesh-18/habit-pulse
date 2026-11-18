// src/components/ui/SettingToggleCard.tsx
import type { LucideIcon } from "lucide-react";

interface SettingToggleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

export function SettingToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: SettingToggleCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent shrink-0 mt-0.5">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-neu-dark">{title}</p>
          <p className="text-xs text-neu-muted mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 p-1 shadow-neu-pressed-sm disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? "bg-neu-accent" : "bg-neu-bg"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}