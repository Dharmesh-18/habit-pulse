// src/components/layout/WalletBadge.tsx
import React from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { Coins, Zap } from "lucide-react";
import { api } from "../../../convex/_generated/api";

interface WalletBadgeProps {
  sessionToken: string;
}

export const WalletBadge: React.FC<WalletBadgeProps> = ({ sessionToken }) => {
  const navigate = useNavigate();
  const effectiveToken =
    sessionToken ||
    (typeof window !== "undefined" ? localStorage.getItem("habit_token") || "" : "");

  const wallet = useQuery(
    api.shop.index.getMyWallet,
    effectiveToken ? { sessionToken: effectiveToken } : "skip"
  );

  const coins = wallet?.coins ?? 0;
  const xp = wallet?.xp ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate("/shop")}
      title={`${coins.toLocaleString()} Coins • ${xp.toLocaleString()} Total XP — Tap to open Shop`}
      className="h-10 px-2.5 sm:px-3 rounded-xl bg-neu-bg shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed transition-all flex items-center gap-2 sm:gap-2.5 shrink-0 cursor-pointer group"
    >
      {/* Coins Compartment */}
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Coins className="w-3 h-3 stroke-[2.5]" />
        </span>
        <div className="flex flex-col items-start leading-none">
          <span className="text-xs font-extrabold text-neu-dark tabular-nums">
            {coins.toLocaleString()}
          </span>
          <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wider text-amber-600/80 mt-0.5">
            Coins
          </span>
        </div>
      </div>

      {/* Subtle Vertical Divider */}
      <span className="w-px h-5 bg-black/10 shrink-0" />

      {/* XP Compartment */}
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-neu-accent/15 text-neu-accent flex items-center justify-center shrink-0">
          <Zap className="w-3 h-3 stroke-[2.5]" />
        </span>
        <div className="flex flex-col items-start leading-none">
          <span className="text-xs font-extrabold text-neu-dark tabular-nums">
            {xp.toLocaleString()}
          </span>
          <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wider text-neu-muted mt-0.5">
            XP
          </span>
        </div>
      </div>
    </button>
  );
};