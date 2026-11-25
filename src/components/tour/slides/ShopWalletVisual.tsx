import React, { useEffect, useState } from "react";
import { Coins, Zap, Snowflake, Sparkles } from "lucide-react";

export const ShopWalletVisual: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 2);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-3 p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {/* Reward Counter Strip */}
      <div className="flex items-center justify-center gap-3">
        <div
          className={`px-3 py-1.5 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-center gap-1.5 transition-transform duration-300 ${
            step === 0 ? "scale-105" : ""
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-extrabold text-neu-dark tabular-nums">
            +5 Coins / Tick
          </span>
        </div>

        <div
          className={`px-3 py-1.5 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-center gap-1.5 transition-transform duration-300 ${
            step === 1 ? "scale-105" : ""
          }`}
        >
          <Zap className="w-4 h-4 text-neu-accent" />
          <span className="text-xs font-extrabold text-neu-dark tabular-nums">
            +10 XP
          </span>
        </div>
      </div>

      {/* Shop Unlocks Preview */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
            <Snowflake className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[11px] font-extrabold text-neu-dark truncate">
              Freeze Shield
            </p>
            <p className="text-[9px] font-bold text-amber-500">75 Coins</p>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neu-accent/15 text-neu-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[11px] font-extrabold text-neu-dark truncate">
              20+ Avatars
            </p>
            <p className="text-[9px] font-bold text-emerald-600">Equip Anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
};