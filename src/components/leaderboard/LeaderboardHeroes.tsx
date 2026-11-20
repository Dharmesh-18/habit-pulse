// src/components/leaderboard/LeaderboardHeroes.tsx
import React from "react";
import { Crown } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NeuCard } from "../ui/NeuCard";
import type { LeaderboardEntry } from "../../../convex/leaderboard/index";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";

interface LeaderboardHeroesProps {
  topThree: LeaderboardEntry[];
}

const PODIUM_CONFIG = {
  1: {
    crownColor:
      "text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.45)]",
    ringClass:
      "ring-4 ring-amber-400/85 shadow-[0_0_24px_rgba(245,158,11,0.28)]",
    badgeBg: "bg-amber-400 text-amber-950",
    sizeClass: "w-20 h-20 sm:w-24 sm:h-24",
    initialTextClass: "text-2xl sm:text-3xl",
    elevateClass: "-mt-4 sm:-mt-6",
  },
  2: {
    crownColor:
      "text-slate-300 fill-slate-300 drop-shadow-[0_2px_6px_rgba(148,163,184,0.4)]",
    ringClass: "ring-4 ring-slate-300/85",
    badgeBg: "bg-slate-300 text-slate-900",
    sizeClass: "w-16 h-16 sm:w-20 sm:h-20",
    initialTextClass: "text-xl sm:text-2xl",
    elevateClass: "mt-4 sm:mt-6",
  },
  3: {
    crownColor:
      "text-amber-600 fill-amber-600 drop-shadow-[0_2px_6px_rgba(180,83,9,0.35)]",
    ringClass: "ring-4 ring-amber-600/80",
    badgeBg: "bg-amber-600 text-white",
    sizeClass: "w-16 h-16 sm:w-20 sm:h-20",
    initialTextClass: "text-xl sm:text-2xl",
    elevateClass: "mt-4 sm:mt-6",
  },
} as const;

interface PodiumAvatarProps {
  name: string;
  avatarStorageId?: Id<"_storage">;
  presetAvatarId?: string;
  slotPosition: 1 | 2 | 3;
}

function resolvePresetAvatarUrl(presetAvatarId?: string): string | null {
  if (!presetAvatarId) return null;
  const slug = presetAvatarId.replace(/^avatar-/, "");
  return `/avatars/${slug}.svg`;
}

const PodiumAvatar: React.FC<PodiumAvatarProps> = ({
  name,
  avatarStorageId,
  presetAvatarId,
  slotPosition,
}) => {
  const style = PODIUM_CONFIG[slotPosition];
  const uploadedAvatarUrl = useQuery(
    api.storage.index.getImageUrl,
    avatarStorageId ? { storageId: avatarStorageId } : "skip"
  );

  const displayUrl = uploadedAvatarUrl || resolvePresetAvatarUrl(presetAvatarId);
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden bg-neu-bg shadow-neu-flat flex items-center justify-center shrink-0 select-none",
        style.sizeClass,
        style.ringClass
      )}
    >
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className={cn(
            "font-black text-neu-accent tracking-tight",
            style.initialTextClass
          )}
        >
          {initial}
        </span>
      )}
    </div>
  );
};

export const LeaderboardHeroes: React.FC<LeaderboardHeroesProps> = ({
  topThree,
}) => {
  if (topThree.length === 0) return null;

  // Classic Podium visual order: [2nd (Left), 1st (Center), 3rd (Right)]
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  const podiumSlots: Array<{
    entry: LeaderboardEntry;
    slotPosition: 1 | 2 | 3;
  }> = [];

  if (second) podiumSlots.push({ entry: second, slotPosition: 2 });
  if (first) podiumSlots.push({ entry: first, slotPosition: 1 });
  if (third) podiumSlots.push({ entry: third, slotPosition: 3 });

  return (
    <NeuCard className="relative overflow-hidden py-6 sm:py-8 px-3 sm:px-6">
      {/* Subtle Radial Spotlight Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-56 bg-[radial-gradient(circle_at_center,var(--theme-accent)_0%,transparent_70%)] opacity-10"
      />

      <div className="text-center mb-6 sm:mb-8">
        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-neu-accent/10 text-neu-accent">
          Today&apos;s Champions
        </span>
        <h2 className="text-base sm:text-lg font-extrabold text-neu-dark mt-2">
          Leaderboard Heroes
        </h2>
      </div>

      {/* Podium Grid */}
      <div className="grid grid-cols-3 items-end justify-items-center gap-2 sm:gap-6 max-w-xl mx-auto pt-2">
        {podiumSlots.map(({ entry, slotPosition }) => {
          const style = PODIUM_CONFIG[slotPosition];

          return (
            <div
              key={entry.userId}
              className={cn(
                "flex flex-col items-center text-center w-full min-w-0 transition-transform duration-300",
                style.elevateClass
              )}
            >
              {/* Crown + Rank Number */}
              <div className="flex flex-col items-center mb-2">
                <Crown
                  className={cn(
                    slotPosition === 1
                      ? "w-7 h-7 sm:w-8 sm:h-8 mb-0.5 animate-pulse"
                      : "w-5 h-5 sm:w-6 sm:h-6 mb-0.5",
                    style.crownColor
                  )}
                />
                <span className="text-xs font-black text-neu-dark">
                  #{entry.rank}
                </span>
              </div>

              {/* Large Circular Profile Avatar (Uploaded Photo, Shop Avatar, or Initial) */}
              <div className="relative">
                <PodiumAvatar
                  name={entry.name}
                  avatarStorageId={
                    entry.avatarStorageId as Id<"_storage"> | undefined
                  }
                  presetAvatarId={entry.presetAvatarId}
                  slotPosition={slotPosition}
                />

                {/* Percentage Pill Overlapping Bottom Edge */}
                <span
                  className={cn(
                    "absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold shadow-md whitespace-nowrap",
                    style.badgeBg
                  )}
                >
                  {entry.percentage}%
                </span>
              </div>

              {/* Player Name & Ratio */}
              <div className="mt-4 w-full px-1">
                <p className="text-xs sm:text-sm font-bold text-neu-dark truncate">
                  {entry.name}
                  {entry.isCurrentUser && (
                    <span className="ml-1 text-[10px] font-extrabold text-neu-accent">
                      (You)
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-neu-muted font-semibold mt-0.5">
                  {entry.completedTasks}/{entry.totalTasks} tasks
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </NeuCard>
  );
};