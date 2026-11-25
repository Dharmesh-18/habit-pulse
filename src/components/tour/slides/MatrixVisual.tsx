import React, { useEffect, useState } from "react";
import { Check, TrendingUp } from "lucide-react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export const MatrixVisual: React.FC = () => {
  const [tickedCount, setTickedCount] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickedCount((prev) => (prev >= 7 ? 3 : prev + 1));
    }, 850);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-3 p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {/* Mini Habit Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-neu-dark truncate">
          Morning Workout
        </span>
        <span className="text-[10px] font-bold text-neu-accent px-2 py-0.5 rounded-full bg-neu-accent/10 tabular-nums">
          {tickedCount}/7 Days
        </span>
      </div>

      {/* 7-Day Interactive Grid Cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day, idx) => {
          const isDone = idx < tickedCount;
          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-neu-muted">{day}</span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? "bg-neu-accent text-white shadow-[0_0_10px_rgba(79,70,229,0.45)] scale-105"
                    : "bg-neu-bg shadow-neu-pressed-sm text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Consistency Trend Bar */}
      <div className="flex items-center gap-2 pt-1 border-t border-black/5">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <div className="flex-1 h-2 rounded-full bg-neu-bg shadow-neu-pressed-sm overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neu-accent to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.round((tickedCount / 7) * 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-extrabold text-emerald-600 tabular-nums">
          {Math.round((tickedCount / 7) * 100)}%
        </span>
      </div>
    </div>
  );
};