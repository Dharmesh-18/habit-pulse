// src/components/achievements/BadgeArtwork.tsx
import React, { useId } from "react";
import { Lock } from "lucide-react";
import { getMilestoneMeta } from "../../lib/achievements";

interface BadgeArtworkProps {
  milestone: number;
  unlocked: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { box: "w-12 h-12", text: "text-xs", sub: "text-[8px]", lock: "w-3.5 h-3.5" },
  md: { box: "w-16 h-16", text: "text-sm", sub: "text-[9px]", lock: "w-4 h-4" },
  lg: { box: "w-28 h-28", text: "text-2xl", sub: "text-[11px]", lock: "w-6 h-6" },
};

export const BadgeArtwork: React.FC<BadgeArtworkProps> = ({
  milestone,
  unlocked,
  size = "md",
}) => {
  const gradId = useId();
  const meta = getMilestoneMeta(milestone);
  const dims = SIZE_MAP[size];

  if (!unlocked) {
    return (
      <div
        className={`${dims.box} rounded-full bg-neu-bg shadow-neu-pressed-sm border border-black/5 flex flex-col items-center justify-center text-neu-muted/60 select-none shrink-0`}
      >
        <Lock className={dims.lock} />
        <span className={`${dims.sub} font-bold mt-0.5`}>{milestone}d</span>
      </div>
    );
  }

  return (
    <div
      style={{ boxShadow: `0 6px 18px ${meta.glowColor}` }}
      className={`${dims.box} relative rounded-full flex items-center justify-center select-none shrink-0`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={meta.secondaryColor} />
            <stop offset="55%" stopColor={meta.primaryColor} />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
        </defs>
        {/* Outer metallic ring */}
        <circle cx="50" cy="50" r="47" fill={`url(#${gradId})`} />
        {/* Inner dark medallion */}
        <circle
          cx="50"
          cy="50"
          r="39"
          fill="#111827"
          stroke={meta.secondaryColor}
          strokeWidth="1.5"
          strokeOpacity="0.65"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white leading-none">
        <span className={`${dims.text} font-black tracking-tight`}>
          {milestone}
        </span>
        <span
          className={`${dims.sub} font-extrabold uppercase tracking-wider opacity-85 mt-0.5`}
        >
          {milestone === 1 ? "Day" : "Days"}
        </span>
      </div>
    </div>
  );
};