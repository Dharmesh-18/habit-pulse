// src/components/leaderboard/RankLaurelBadge.tsx
import React from "react";

interface RankLaurelBadgeProps {
  rank: number;
}

const MEDAL_STYLES: Record<
  number,
  { primary: string; secondary: string; textClass: string }
> = {
  1: {
    primary: "#F59E0B", // Rich Gold
    secondary: "#FCD34D",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  2: {
    primary: "#94A3B8", // Crisp Silver
    secondary: "#CBD5E1",
    textClass: "text-slate-600 dark:text-slate-300",
  },
  3: {
    primary: "#B45309", // Warm Bronze
    secondary: "#D97706",
    textClass: "text-amber-800 dark:text-amber-500",
  },
};

export const RankLaurelBadge: React.FC<RankLaurelBadgeProps> = ({ rank }) => {
  const medal = MEDAL_STYLES[rank];

  if (!medal) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-neu-bg shadow-neu-pressed-sm text-xs font-extrabold text-neu-muted">
        #{rank}
      </span>
    );
  }

  const gradId = `laurel-grad-${rank}`;

  return (
    <div
      className="relative inline-flex items-center justify-center w-11 h-10 select-none"
      title={`Rank #${rank}`}
    >
      <svg
        viewBox="0 0 64 52"
        className="w-11 h-10 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={medal.secondary} />
            <stop offset="100%" stopColor={medal.primary} />
          </linearGradient>
        </defs>

        {/* Left Laurel Branch */}
        <g fill={`url(#${gradId})`}>
          <path d="M26 45 C14 41, 8 29, 12 13 C14 23, 18 35, 28 43 Z" opacity="0.85" />
          <ellipse cx="11" cy="16" rx="2.3" ry="5" transform="rotate(-25 11 16)" />
          <ellipse cx="10" cy="24" rx="2.4" ry="5.2" transform="rotate(-40 10 24)" />
          <ellipse cx="12" cy="32" rx="2.4" ry="5.2" transform="rotate(-55 12 32)" />
          <ellipse cx="17" cy="39" rx="2.3" ry="5" transform="rotate(-70 17 39)" />
          <ellipse cx="23" cy="43" rx="2" ry="4.5" transform="rotate(-82 23 43)" />
        </g>

        {/* Right Laurel Branch */}
        <g fill={`url(#${gradId})`}>
          <path d="M38 45 C50 41, 56 29, 52 13 C50 23, 46 35, 36 43 Z" opacity="0.85" />
          <ellipse cx="53" cy="16" rx="2.3" ry="5" transform="rotate(25 53 16)" />
          <ellipse cx="54" cy="24" rx="2.4" ry="5.2" transform="rotate(40 54 24)" />
          <ellipse cx="52" cy="32" rx="2.4" ry="5.2" transform="rotate(55 52 32)" />
          <ellipse cx="47" cy="39" rx="2.3" ry="5" transform="rotate(70 47 39)" />
          <ellipse cx="41" cy="43" rx="2" ry="4.5" transform="rotate(82 41 43)" />
        </g>
      </svg>

      {/* Centered Rank Number */}
      <span
        className={`absolute inset-0 flex items-center justify-center text-sm font-black tracking-tight pb-0.5 ${medal.textClass}`}
      >
        {rank}
      </span>
    </div>
  );
};