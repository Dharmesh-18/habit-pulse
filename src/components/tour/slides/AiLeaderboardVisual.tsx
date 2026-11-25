import React, { useEffect, useState } from "react";
import { Sparkles, Trophy, FileText } from "lucide-react";

export const AiLeaderboardVisual: React.FC = () => {
  const [highlightRank, setHighlightRank] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHighlightRank((prev) => (prev + 1) % 3);
    }, 1300);
    return () => clearInterval(timer);
  }, []);

  const ranks = [
    { rank: "#1", name: "You", xp: "1,420 XP" },
    { rank: "#2", name: "Aarav", xp: "1,290 XP" },
    { rank: "#3", name: "Riya", xp: "1,150 XP" },
  ];

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-2.5 p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {/* AI Pulse Coach Dossier Pill */}
      <div className="p-2.5 rounded-xl bg-neu-bg shadow-neu-flat-sm border border-neu-accent/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-neu-accent/15 text-neu-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[11px] font-extrabold text-neu-dark truncate">
              AI Pulse Coach PDF
            </p>
            <p className="text-[9px] text-neu-muted truncate">
              Weekly & Monthly habit insights
            </p>
          </div>
        </div>
        <FileText className="w-4 h-4 text-neu-accent shrink-0" />
      </div>

      {/* Mini Top 3 Leaderboard */}
      <div className="flex flex-col gap-1.5">
        {ranks.map((r, idx) => (
          <div
            key={r.rank}
            className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-bold transition-all duration-300 ${
              idx === highlightRank
                ? "bg-neu-accent text-white shadow-sm scale-[1.02]"
                : "bg-neu-bg shadow-neu-flat-sm text-neu-dark"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Trophy
                className={`w-3 h-3 ${
                  idx === highlightRank ? "text-amber-300" : "text-amber-500"
                }`}
              />
              <span>
                {r.rank} {r.name}
              </span>
            </span>
            <span className="tabular-nums opacity-90">{r.xp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};