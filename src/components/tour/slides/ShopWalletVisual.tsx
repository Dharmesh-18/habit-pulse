// src/components/tour/slides/ShopWalletVisual.tsx
import React, { useEffect, useState } from "react";
import {
  Coins,
  Zap,
  Snowflake,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  CreditCard,
} from "lucide-react";

const MINI_AVATARS = [
  { name: "Coco", price: 100, asset: "/avatars/coco.svg", owned: true },
  { name: "Poki", price: 100, asset: "/avatars/poki.svg", owned: true },
  { name: "Charma", price: 200, asset: "/avatars/charma.svg", owned: false },
  { name: "Panda", price: 250, asset: "/avatars/panda.svg", owned: false },
];

const MINI_COIN_PACKS = [
  { coins: "200 Coins", price: "₹49", tag: "Starter" },
  { coins: "550 Coins", price: "₹99", tag: "Popular" },
];

const SECTION_LABELS = ["1. Power-Ups", "2. Avatars (2×2)", "3. Coin Packs"];

export const ShopWalletVisual: React.FC = () => {
  // 0 = Power-Ups, 1 = 2x2 Avatars Grid, 2 = Coin Packs
  const [sectionIdx, setSectionIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSectionIdx((prev) => (prev + 1) % 3);
    }, 1700);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-2.5 p-3 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {/* Top Reward Strip + Active Section Indicator */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-lg bg-neu-bg shadow-neu-flat-sm flex items-center gap-1 text-[10px] font-extrabold text-neu-dark tabular-nums">
            <Coins className="w-3 h-3 text-amber-500" />
            <span>+5/Tick</span>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-neu-bg shadow-neu-flat-sm flex items-center gap-1 text-[10px] font-extrabold text-neu-dark tabular-nums">
            <Zap className="w-3 h-3 text-neu-accent" />
            <span>+10 XP</span>
          </span>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-neu-accent/10 text-neu-accent text-[9px] font-extrabold">
          {SECTION_LABELS[sectionIdx]}
        </span>
      </div>

      {/* Auto-Scrolling Mini Shop Viewport */}
      <div className="relative h-[132px] overflow-hidden rounded-xl bg-neu-bg/60">
        <div
          className="transition-transform duration-700 ease-in-out"
          style={{ transform: `translateY(-${sectionIdx * 132}px)` }}
        >
          {/* Section 1: Power-Ups (Streak Freeze Shield) */}
          <div className="h-[132px] p-1 flex flex-col justify-center gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-600">
                Power-Ups
              </span>
              <span className="text-[9px] font-bold text-neu-muted">
                Owned: 1/3
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neu-bg shadow-neu-flat-sm border border-sky-500/20 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
                  <Snowflake className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[11px] font-extrabold text-neu-dark truncate">
                    Streak Freeze Shield
                  </p>
                  <p className="text-[9px] text-neu-muted leading-tight mt-0.5">
                    Saves missed yesterday&apos;s streak
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-neu-accent text-white text-[10px] font-extrabold flex items-center gap-1 shrink-0 tabular-nums">
                <Coins className="w-3 h-3 text-amber-300" />
                <span>75</span>
              </span>
            </div>
          </div>

          {/* Section 2: 2x2 Avatars Grid */}
          <div className="h-[132px] p-1 flex flex-col justify-center gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-neu-accent">
                Collectible Avatars
              </span>
              <span className="text-[9px] font-bold text-neu-muted">
                20+ Avatars
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {MINI_AVATARS.map((av) => (
                <div
                  key={av.name}
                  className="px-2 py-1.5 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-center justify-between gap-1.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img
                      src={av.asset}
                      alt={av.name}
                      className="w-6 h-6 rounded-full object-cover shrink-0 bg-neu-bg shadow-neu-flat-sm"
                    />
                    <span className="text-[10px] font-extrabold text-neu-dark truncate">
                      {av.name}
                    </span>
                  </div>

                  {av.owned ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 text-[8px] font-extrabold flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Equip</span>
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md bg-neu-accent text-white text-[8px] font-extrabold flex items-center gap-0.5 shrink-0 tabular-nums">
                      <ShoppingBag className="w-2.5 h-2.5" />
                      <span>{av.price}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Coin Top-Up Packs */}
          <div className="h-[132px] p-1 flex flex-col justify-center gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600">
                Coin Top-Up Packs
              </span>
              <span className="text-[9px] font-bold text-neu-muted flex items-center gap-1">
                <CreditCard className="w-2.5 h-2.5" />
                <span>Instant Credit</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {MINI_COIN_PACKS.map((pack) => (
                <div
                  key={pack.coins}
                  className="p-2.5 rounded-xl bg-neu-bg shadow-neu-flat-sm border border-amber-500/20 flex flex-col items-center text-center gap-1"
                >
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 text-[8px] font-extrabold">
                    {pack.tag}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-neu-dark">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{pack.coins}</span>
                  </div>
                  <span className="w-full py-1 rounded-lg bg-neu-accent text-white text-[9px] font-extrabold tabular-nums">
                    Buy • {pack.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};