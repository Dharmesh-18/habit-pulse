import React, { useEffect, useState } from "react";
import { Trophy, Zap, Crown } from "lucide-react";

const RANKS = [
  { rank: "#1", name: "You", xp: "1,420", isYou: true },
  { rank: "#2", name: "Aarav", xp: "1,290", isYou: false },
  { rank: "#3", name: "Riya", xp: "1,150", isYou: false },
];

export const LeaderboardVisual: React.FC = () => {
  const [highlightRank, setHighlightRank] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHighlightRank((prev) => (prev + 1) % RANKS.length);
    }, 1250);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-2.5 p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-neu-dark">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <span>Global Top 10 Arena</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-neu-accent/10 text-neu-accent text-[9px] font-extrabold">
          Live XP Ranks
        </span>
      </div>

      {/* Top 3 Leaderboard Rows */}
      <div className="flex flex-col gap-1.5">
        {RANKS.map((r, idx) => {
          const active = idx === highlightRank;
          return (
            <div
              key={r.rank}
              className={`px-3 py-2 rounded-xl flex items-center justify-between text-[11px] font-extrabold transition-all duration-300 ${
                active
                  ? "bg-neu-accent text-white shadow-sm scale-[1.02]"
                  : "bg-neu-bg shadow-neu-flat-sm text-neu-dark"
              }`}
            >
              <span className="flex items-center gap-2">
                <Trophy
                  className={`w-3.5 h-3.5 ${
                    idx === 0
                      ? active
                        ? "text-amber-300"
                        : "text-amber-500"
                      : active
                        ? "text-white/90"
                        : "text-neu-muted"
                  }`}
                />
                <span>
                  {r.rank} {r.name}
                </span>
              </span>

              <span className="flex items-center gap-0.5 tabular-nums">
                <Zap className="w-3 h-3 fill-current" />
                <span>{r.xp} XP</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};