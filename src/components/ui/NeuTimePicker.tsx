// src/components/ui/NeuTimePicker.tsx
import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface NeuTimePickerProps {
  value: string; // "HH:mm" 24-hour format (e.g. "08:00")
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

const HOURS_12 = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
const MINUTES_STEP_5 = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

const QUICK_PRESETS = [
  { label: "7:00 AM", value: "07:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "6:00 PM", value: "18:00" },
  { label: "9:30 PM", value: "21:30" },
];

function parse24To12(time24: string) {
  const [rawH = "08", rawM = "00"] = (time24 || "08:00").split(":");
  const h24 = parseInt(rawH, 10);
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12Num = h24 % 12 === 0 ? 12 : h24 % 12;
  const hour12 = String(h12Num).padStart(2, "0");
  const minute = rawM.padStart(2, "0");
  return { hour12, minute, period };
}

function format12To24(hour12: string, minute: string, period: "AM" | "PM"): string {
  let h = parseInt(hour12, 10);
  if (period === "AM") {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2, "0")}:${minute}`;
}

export const NeuTimePicker: React.FC<NeuTimePickerProps> = ({
  value,
  onChange,
  id,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouchDevice(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Mobile Touch Devices: Keep native OS clock wheel for thumb ergonomics
  if (isTouchDevice) {
    return (
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-neu-bg shadow-neu-pressed rounded-xl py-2.5 text-sm font-medium text-neu-dark outline-none focus:ring-2 focus:ring-neu-accent/40 transition-all ${className}`}
      />
    );
  }

  // Desktop: Theme-aware custom popover time picker
  const { hour12, minute, period } = parse24To12(value);

  const handleSelectHour = (newHour: string) => {
    onChange(format12To24(newHour, minute, period));
  };

  const handleSelectMinute = (newMin: string) => {
    onChange(format12To24(hour12, newMin, period));
  };

  const handleSelectPeriod = (newPeriod: "AM" | "PM") => {
    onChange(format12To24(hour12, minute, newPeriod));
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button (Matches NeuInput / NeuSelect aesthetics) */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-neu-bg px-3.5 py-2.5 rounded-xl text-sm font-medium text-neu-dark flex items-center justify-between gap-2 transition-all outline-none ${
          isOpen
            ? "shadow-neu-pressed ring-2 ring-neu-accent/40"
            : "shadow-neu-pressed hover:ring-1 hover:ring-neu-accent/30"
        }`}
      >
        <span className="tabular-nums tracking-wide">
          {hour12}:{minute} {period}
        </span>
        <Clock className="w-4 h-4 text-neu-accent shrink-0" />
      </button>

      {/* Desktop Theme-Aware Popover */}
      {isOpen && (
        <div
          style={{
            backgroundColor: "var(--theme-surface-elevated)",
            borderColor: "var(--theme-border)",
          }}
          className="absolute right-0 mt-2 w-64 rounded-2xl border shadow-neu-flat-lg p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Quick Presets */}
          <div className="mb-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neu-muted px-1 mb-1.5">
              Quick Presets
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_PRESETS.map((preset) => {
                const isSelected = value === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      onChange(preset.value);
                      setIsOpen(false);
                    }}
                    className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                      isSelected
                        ? "bg-neu-accent text-white shadow-sm"
                        : "bg-neu-bg/70 text-neu-text hover:text-neu-dark hover:bg-neu-bg"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-black/5 my-2" />

          {/* 3-Column Selector: Hour | Minute | AM/PM */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {/* Hours */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase text-neu-muted mb-1">
                Hr
              </span>
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1 pr-0.5">
                {HOURS_12.map((h) => {
                  const active = h === hour12;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectHour(h)}
                      className={`py-1 rounded-lg text-xs font-semibold tabular-nums transition-all ${
                        active
                          ? "bg-neu-accent text-white shadow-sm"
                          : "text-neu-text hover:bg-neu-bg hover:text-neu-dark"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes (5-min intervals + exact custom minute support) */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase text-neu-muted mb-1">
                Min
              </span>
              <div className="max-h-40 overflow-y-auto flex flex-col gap-1 pr-0.5">
                {(MINUTES_STEP_5.includes(minute)
                  ? MINUTES_STEP_5
                  : [minute, ...MINUTES_STEP_5].sort()
                ).map((m) => {
                  const active = m === minute;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={`py-1 rounded-lg text-xs font-semibold tabular-nums transition-all ${
                        active
                          ? "bg-neu-accent text-white shadow-sm"
                          : "text-neu-text hover:bg-neu-bg hover:text-neu-dark"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AM / PM */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase text-neu-muted mb-1">
                Period
              </span>
              <div className="flex flex-col gap-1.5">
                {(["AM", "PM"] as const).map((p) => {
                  const active = p === period;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSelectPeriod(p)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        active
                          ? "bg-neu-accent text-white shadow-sm"
                          : "bg-neu-bg/60 text-neu-text hover:bg-neu-bg hover:text-neu-dark"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};