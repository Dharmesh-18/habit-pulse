import React, { useEffect, useState } from "react";
import { Check, Snowflake, Flame } from "lucide-react";

export const StreakFreezeVisual: React.FC = () => {
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFrozen((prev) => !prev);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-3 p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-extrabold text-neu-dark">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span>18-Day Streak</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 text-[10px] font-extrabold">
          {isFrozen ? "Protected ❄️" : "Missed Yesterday"}
        </span>
      </div>

      {/* 4-Day Timeline showing Yesterday bridged by Shield */}
      <div className="grid grid-cols-4 gap-2 py-1">
        {["Day 17", "Day 18", "Yesterday", "Today"].map((label, idx) => {
          const isYesterday = idx === 2;
          const isToday = idx === 3;

          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-neu-muted">
                {label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  isYesterday
                    ? isFrozen
                      ? "bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.55)] scale-105"
                      : "bg-sky-500/15 text-sky-500 animate-pulse border border-sky-400/40"
                    : isToday
                      ? "bg-neu-bg shadow-neu-pressed-sm text-neu-muted"
                      : "bg-neu-accent text-white shadow-neu-flat-sm"
                }`}
              >
                {isYesterday ? (
                  <Snowflake className="w-4 h-4 stroke-[2.5]" />
                ) : isToday ? (
                  <span className="text-[10px] font-bold">?</span>
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-semibold text-neu-muted text-center">
        {isFrozen
          ? "Chain bridged! Complete Today to hit Day 19."
          : "Tap ❄️ on a missed yesterday to save your streak"}
      </p>
    </div>
  );
};