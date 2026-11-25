// src/components/layout/WalletBadge.tsx
import React from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { Coins, Snowflake } from "lucide-react";
import { api } from "../../../convex/_generated/api";

interface WalletBadgeProps {
  sessionToken: string;
}

export function formatCompactStat(value: number): string {
  if (value < 10_000) return value.toLocaleString();
  if (value < 1_000_000) {
    const k = value / 1_000;
    return `${k >= 100 ? Math.round(k) : Number(k.toFixed(1))}K`;
  }
  const m = value / 1_000_000;
  return `${Number(m.toFixed(1))}M`;
}

export const WalletBadge: React.FC<WalletBadgeProps> = ({ sessionToken }) => {
  const navigate = useNavigate();
  const effectiveToken =
    sessionToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("habit_token") || ""
      : "");

  const wallet = useQuery(
    api.shop.index.getMyWallet,
    effectiveToken ? { sessionToken: effectiveToken } : "skip",
  );

  const coins = wallet?.coins ?? 0;
  const shields = wallet?.shields ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate("/shop")}
      title={`${coins.toLocaleString()} Coins • ${shields}/3 Streak Shields — Tap to open Shop`}
      className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-neu-bg shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed transition-all flex items-center gap-1.5 sm:gap-2.5 shrink-0 cursor-pointer group"
    >
      {/* Coins Compartment */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
        </span>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[11px] sm:text-xs font-extrabold text-neu-dark tabular-nums">
            {formatCompactStat(coins)}
          </span>
          <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wider text-amber-600/80 mt-0.5">
            Coins
          </span>
        </div>
      </div>

      {/* Subtle Vertical Divider */}
      <span className="w-px h-4 sm:h-5 bg-black/10 shrink-0" />

      {/* Streak Freeze Shields Compartment */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
          <Snowflake className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
        </span>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[11px] sm:text-xs font-extrabold text-sky-600 tabular-nums">
            {shields}/3
          </span>
          <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wider text-sky-600/80 mt-0.5">
            Shields
          </span>
        </div>
      </div>
    </button>
  );
};