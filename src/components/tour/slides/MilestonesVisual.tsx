// src/components/tour/slides/MilestonesVisual.tsx
import React, { useEffect, useState } from "react";
import { Award, Check, Lock, Palette, Share2, Download, Sparkles } from "lucide-react";

const TIMELINE_NODES = [
  { days: "1D", unlockedAtStep: 0 },
  { days: "3D", unlockedAtStep: 1 },
  { days: "7D", unlockedAtStep: 2 },
  { days: "14D", unlockedAtStep: 99 },
  { days: "21D", unlockedAtStep: 99 },
];

export const MilestonesVisual: React.FC = () => {
  // Step 0: 1D unlocked -> Step 1: 3D unlocked -> Step 2: 7D unlocked -> Step 3: Shareable Card Pop-up!
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 1300);
    return () => clearInterval(timer);
  }, []);

  const showShareModal = step === 3;
  const progressPercent = step === 0 ? 15 : step === 1 ? 38 : 62;

  return (
    <div className="relative w-full max-w-xs mx-auto p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm overflow-hidden">
      {/* Background: Actual Horizontal Milestone Streak Timeline */}
      <div
        className={`flex flex-col gap-3 transition-all duration-300 ${
          showShareModal ? "opacity-30 scale-[0.97] blur-[1px]" : "opacity-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-neu-dark">
            Morning Workout • Streak Line
          </span>
          <span className="px-2 py-0.5 rounded-full bg-neu-accent/10 text-neu-accent text-[10px] font-extrabold tabular-nums">
            {step === 0 ? "1 Day" : step === 1 ? "3 Days" : "7 Days 🔥"}
          </span>
        </div>

        {/* Horizontal Progress Track + Nodes */}
        <div className="relative py-2 px-1">
          {/* Base Track */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-neu-bg shadow-neu-pressed-sm overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neu-accent to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Milestone Nodes */}
          <div className="relative flex items-center justify-between">
            {TIMELINE_NODES.map((node) => {
              const isUnlocked = step >= node.unlockedAtStep;
              const isLatestHit =
                (step === 0 && node.days === "1D") ||
                (step === 1 && node.days === "3D") ||
                (step >= 2 && node.days === "7D");

              return (
                <div
                  key={node.days}
                  className="flex flex-col items-center gap-1 z-10"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-500 ${
                      isUnlocked
                        ? "bg-neu-accent text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                        : "bg-neu-bg shadow-neu-flat-sm text-neu-muted"
                    } ${isLatestHit ? "scale-110 ring-2 ring-amber-400" : ""}`}
                  >
                    {isUnlocked ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Lock className="w-3 h-3 opacity-60" />
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-extrabold tabular-nums ${
                      isUnlocked ? "text-neu-dark" : "text-neu-muted"
                    }`}
                  >
                    {node.days}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Theme Unlock Strip */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-neu-bg shadow-neu-flat-sm text-[10px] font-bold">
          <span className="flex items-center gap-1.5 text-neu-accent">
            <Palette className="w-3.5 h-3.5" />
            <span>Unlocks Custom Themes</span>
          </span>
          <span className="text-[9px] text-neu-muted">Tap badge to share</span>
        </div>
      </div>

      {/* Pop-Up Mini Shareable Achievement Card Modal (Step 3) */}
      {showShareModal && (
        <div className="absolute inset-0 flex items-center justify-center p-2.5 animate-[fadeIn_0.25s_ease-out]">
          <div className="w-full max-w-[235px] p-3 rounded-2xl bg-neu-bg shadow-neu-flat border border-neu-accent/30 flex flex-col items-center text-center gap-2">
            <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-500">
              <Sparkles className="w-3 h-3" />
              <span>7-Day Milestone Unlocked!</span>
            </div>

            {/* Mini Share Card Preview */}
            <div className="w-full py-2 px-3 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-sm">
              <div className="text-left">
                <p className="text-[11px] font-extrabold leading-tight">
                  Week Warrior
                </p>
                <p className="text-[9px] opacity-85">Morning Workout • 7D</p>
              </div>
              <Award className="w-5 h-5 text-amber-300 shrink-0" />
            </div>

            {/* Mini Share / Download Action Pills */}
            <div className="w-full grid grid-cols-2 gap-1.5 pt-0.5">
              <span className="py-1 px-2 rounded-lg bg-neu-accent text-white text-[9px] font-extrabold flex items-center justify-center gap-1">
                <Share2 className="w-2.5 h-2.5" />
                <span>Share Card</span>
              </span>
              <span className="py-1 px-2 rounded-lg bg-neu-bg shadow-neu-flat-sm text-neu-dark text-[9px] font-extrabold flex items-center justify-center gap-1">
                <Download className="w-2.5 h-2.5" />
                <span>Save PNG</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};