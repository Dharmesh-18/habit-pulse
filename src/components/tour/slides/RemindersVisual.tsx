import React, { useEffect, useState } from "react";
import { BellRing, Mail, CheckCircle2 } from "lucide-react";

export const RemindersVisual: React.FC = () => {
  const [pulseState, setPulseState] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseState((prev) => (prev + 1) % 3);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-2.5 p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {/* Live Push Notification Banner */}
      <div
        className={`p-3 rounded-xl bg-neu-bg shadow-neu-flat-sm border border-neu-accent/20 flex items-center gap-3 transition-all duration-500 ${
          pulseState === 1 ? "scale-[1.03] ring-2 ring-neu-accent/40" : ""
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-neu-accent/15 text-neu-accent flex items-center justify-center shrink-0">
          <BellRing
            className={`w-4 h-4 ${pulseState === 1 ? "animate-bounce" : ""}`}
          />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-extrabold text-neu-dark truncate">
              ⏰ Deep Work Session
            </span>
            <span className="text-[9px] font-bold text-neu-accent">NOW</span>
          </div>
          <p className="text-[10px] text-neu-muted truncate mt-0.5">
            Keep your 14-day streak alive!
          </p>
        </div>
      </div>

      {/* Dual Channel Sync Pill */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-neu-bg shadow-neu-flat-sm text-[10px] font-bold">
        <span className="flex items-center gap-1.5 text-neu-dark">
          <Mail className="w-3.5 h-3.5 text-amber-500" />
          <span>Email + Device Push</span>
        </span>
        <span className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="w-3 h-3" />
          <span>Auto-Skips if Done</span>
        </span>
      </div>
    </div>
  );
};