// src/components/tour/slides/ChallengesVisual.tsx
import React, { useEffect, useState } from "react";
import {
  Users,
  BellRing,
  Check,
  Trophy,
  Coins,
  Flame,
  Sparkles,
} from "lucide-react";

export const ChallengesVisual: React.FC = () => {
  // 0: Squad Timeline (6/7) | 1: Nudge Triggered (Push + Email) | 2: Day 7 Completed (7/7) | 3: Jackpot Coins Credited!
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % 4);
    }, 1450);
    return () => clearInterval(timer);
  }, []);

  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="w-full max-w-xs mx-auto p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {stage < 3 ? (
        <div className="h-[136px] flex flex-col justify-between p-3 rounded-xl bg-neu-bg shadow-neu-flat-sm border border-neu-accent/15 relative overflow-visible">
          {/* Floating Push + Email Notification Banner on Stage 1 */}
          {stage === 1 && (
            <div className="absolute -top-3.5 inset-x-3 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[9px] font-extrabold shadow-md flex items-center justify-center gap-1 animate-bounce z-10 pointer-events-none">
              <BellRing className="w-2.5 h-2.5 shrink-0" />
              <span>Push &amp; Email Nudge Sent to Buddy!</span>
            </div>
          )}

          {/* Top Row: Solo | Duo | Clan Mode Pills + Nudge Button */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded-md bg-neu-bg shadow-neu-flat-sm text-[8px] font-extrabold text-neu-muted">
                SOLO
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-neu-accent text-white text-[8px] font-extrabold inline-flex items-center gap-0.5 shadow-sm">
                <Users className="w-2.5 h-2.5" />
                <span>DUO</span>
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-neu-bg shadow-neu-flat-sm text-[8px] font-extrabold text-neu-muted">
                CLAN
              </span>
            </div>

            {/* Interactive Nudge Pill */}
            <div
              className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold inline-flex items-center gap-1 transition-all duration-300 ${
                stage === 1
                  ? "bg-amber-500 text-white scale-95 shadow-inner"
                  : stage === 2
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-amber-500/15 text-amber-600"
              }`}
            >
              {stage === 2 ? (
                <>
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>All Done!</span>
                </>
              ) : (
                <>
                  <BellRing className="w-2.5 h-2.5" />
                  <span>{stage === 1 ? "Nudged • 15m" : "Nudge"}</span>
                </>
              )}
            </div>
          </div>

          {/* Middle Row: 7-Day Streak Chain (D1 -> D7) */}
          <div className="grid grid-cols-7 gap-1 py-1">
            {days.map((day) => {
              const isFinalDay = day === 7;
              const isCompleted = day <= 6 || (isFinalDay && stage === 2);
              const isWaitingBuddy = isFinalDay && stage < 2;

              return (
                <div
                  key={day}
                  className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isWaitingBuddy
                        ? stage === 1
                          ? "bg-amber-500/20 text-amber-600 ring-1 ring-amber-500"
                          : "bg-neu-bg shadow-neu-pressed-sm text-neu-accent ring-1 ring-neu-accent/40"
                        : "bg-neu-bg shadow-neu-flat-sm text-neu-muted"
                  }`}
                >
                  <span className="text-[8px] font-extrabold">D{day}</span>
                  {isCompleted ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping my-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Status Strip */}
          <div className="flex items-center justify-between text-[9px] font-bold text-neu-muted pt-1 border-t border-black/5">
            <span className="inline-flex items-center gap-1 text-orange-600 font-extrabold">
              <Flame className="w-3 h-3" />
              <span>
                {stage === 2 ? "Day 7/7 Complete!" : "Day 7/7 • No Freeze"}
              </span>
            </span>
            <span className="text-amber-600 font-extrabold inline-flex items-center gap-0.5">
              <Coins className="w-2.5 h-2.5" />
              <span>Jackpot Ready</span>
            </span>
          </div>
        </div>
      ) : (
        /* Stage 3: Challenge Completed -> Huge Coin Jackpot Credited! */
        <div className="h-[136px] flex flex-col items-center justify-center gap-2 px-3 rounded-xl bg-neu-bg shadow-neu-flat-sm border border-amber-500/30 animate-[fadeIn_0.25s_ease-out]">
          <div className="relative flex items-center justify-center">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shadow-neu-flat-sm">
              <Trophy className="w-6 h-6 stroke-[2.3]" />
            </div>
            <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1.5 -right-2 animate-pulse" />
          </div>

          <div className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-extrabold inline-flex items-center gap-1 shadow-sm animate-bounce">
            <Coins className="w-3.5 h-3.5" />
            <span>+200 Jackpot Coins!</span>
          </div>

          <div className="flex flex-col items-center text-center leading-tight">
            <span className="text-[11px] font-extrabold text-emerald-600">
              7-Day Streak Conquered!
            </span>
            <span className="text-[9px] font-semibold text-neu-muted mt-0.5">
              Credited to every squad member&apos;s wallet
            </span>
          </div>
        </div>
      )}
    </div>
  );
};