import React, { useEffect, useState } from "react";
import { Award, Palette, Share2 } from "lucide-react";

const BADGES = [
  { days: "7D", title: "Week Warrior", color: "from-indigo-500 to-purple-500" },
  { days: "21D", title: "Habit Forged", color: "from-emerald-500 to-teal-500" },
  { days: "100D", title: "Centurion", color: "from-amber-500 to-orange-500" },
];

export const MilestonesVisual: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % BADGES.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-3 p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {/* 3 Milestone Cards */}
      <div className="grid grid-cols-3 gap-2">
        {BADGES.map((b, idx) => {
          const active = idx === activeIdx;
          return (
            <div
              key={b.days}
              className={`p-2.5 rounded-xl bg-neu-bg transition-all duration-500 flex flex-col items-center gap-1 ${
                active
                  ? "shadow-neu-flat scale-105 ring-2 ring-neu-accent/40"
                  : "shadow-neu-pressed-sm opacity-65"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${b.color} text-white flex items-center justify-center text-[10px] font-extrabold shadow`}
              >
                {b.days}
              </div>
              <span className="text-[9px] font-extrabold text-neu-dark truncate w-full text-center">
                {b.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Theme + Shareable Card Strip */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-neu-bg shadow-neu-flat-sm text-[10px] font-bold">
        <span className="flex items-center gap-1.5 text-neu-accent">
          <Palette className="w-3.5 h-3.5" />
          <span>Unlocks Themes</span>
        </span>
        <span className="flex items-center gap-1 text-neu-dark">
          <Share2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Shareable Cards</span>
        </span>
        <Award className="w-3.5 h-3.5 text-amber-500" />
      </div>
    </div>
  );
};