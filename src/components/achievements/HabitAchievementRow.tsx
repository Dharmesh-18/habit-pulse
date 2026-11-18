// src/components/achievements/HabitAchievementRow.tsx
import React from "react";
import { Flame, Trophy, Sparkles } from "lucide-react";
import { NeuCard } from "../ui/NeuCard";
import { BadgeArtwork } from "./BadgeArtwork";
import { getMilestoneMeta } from "../../lib/achievements";
import { getCategoryMeta } from "../../lib/categories";

export interface HabitAchievementItem {
  habitId: string;
  title: string;
  category: string;
  currentStreak: number;
  longestStreak: number;
  unlockedMilestones: Array<{ milestone: number; unlockedAt: number }>;
}

interface HabitAchievementRowProps {
  item: HabitAchievementItem;
  milestones: number[];
  onSelectBadge: (milestone: number, unlockedAt: number) => void;
}

export const HabitAchievementRow: React.FC<HabitAchievementRowProps> = ({
  item,
  milestones,
  onSelectBadge,
}) => {
  const catMeta = getCategoryMeta(item.category);
  const CategoryIcon = catMeta.icon;

  const unlockedMap = new Map(
    item.unlockedMilestones.map((u) => [u.milestone, u.unlockedAt]),
  );

  // Calculate segmented progress percentage across milestone nodes
  const progressPercent = React.useMemo(() => {
    if (milestones.length <= 1 || item.currentStreak <= 0) return 0;
    const maxMilestone = milestones[milestones.length - 1];
    if (item.currentStreak >= maxMilestone) return 100;

    // Piecewise linear interpolation between milestone nodes for accurate visual alignment
    for (let i = 0; i < milestones.length; i++) {
      if (item.currentStreak < milestones[i]) {
        if (i === 0) {
          return (item.currentStreak / milestones[0]) * (100 / milestones.length) * 0.5;
        }
        const prev = milestones[i - 1];
        const next = milestones[i];
        const segmentProgress = (item.currentStreak - prev) / (next - prev);
        const basePct = ((i - 1) / (milestones.length - 1)) * 100;
        const stepPct = 100 / (milestones.length - 1);
        return Math.min(100, basePct + segmentProgress * stepPct);
      }
    }
    return 100;
  }, [item.currentStreak, milestones]);

  const nextTarget = milestones.find((m) => !unlockedMap.has(m));

  return (
    <NeuCard className="flex flex-col gap-4 p-5 sm:p-6">
      {/* Header: Habit Info + Current & Best Streak Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-neu-dark tracking-tight">
              {item.title}
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neu-bg shadow-neu-pressed-sm text-[11px] font-semibold text-neu-dark">
              <CategoryIcon className={`w-3 h-3 ${catMeta.color}`} />
              {catMeta.label}
            </span>
          </div>

          <p className="text-xs text-neu-muted">
            {nextTarget
              ? `${Math.max(0, nextTarget - item.currentStreak)} more day${
                  nextTarget - item.currentStreak === 1 ? "" : "s"
                } to unlock ${getMilestoneMeta(nextTarget).title} (${nextTarget}d)`
              : "All streak milestones conquered!"}
          </p>
        </div>

        {/* Streak Stats */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neu-bg shadow-neu-pressed-sm">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <div className="leading-tight">
              <span className="text-xs font-extrabold text-neu-dark">
                {item.currentStreak}d
              </span>
              <span className="text-[10px] text-neu-muted block">Current</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neu-bg shadow-neu-pressed-sm">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div className="leading-tight">
              <span className="text-xs font-extrabold text-neu-dark">
                {item.longestStreak}d
              </span>
              <span className="text-[10px] text-neu-muted block">Best</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Milestone Track (Touch-scrollable on mobile, spacious on desktop) */}
      <div className="overflow-x-auto pb-2 pt-1 -mx-1 px-1">
        <div className="relative min-w-[740px] flex items-center justify-between py-2 px-3">
          {/* Background Track Line */}
          <div className="absolute left-8 right-8 top-8 h-2 rounded-full bg-neu-bg shadow-neu-pressed-sm overflow-hidden">
            {/* Active Progress Fill */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Milestone Nodes */}
          {milestones.map((days) => {
            const unlockedAt = unlockedMap.get(days);
            const isUnlocked = unlockedAt !== undefined;
            const meta = getMilestoneMeta(days);

            return (
              <button
                key={days}
                type="button"
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onSelectBadge(days, unlockedAt)}
                title={
                  isUnlocked
                    ? `${meta.title} (${days}d) — Tap to view & share`
                    : `Locked: Reach a ${days}-day streak to unlock`
                }
                className={`relative z-10 flex flex-col items-center gap-1.5 group outline-none ${
                  isUnlocked
                    ? "cursor-pointer hover:-translate-y-0.5 transition-transform"
                    : "cursor-not-allowed opacity-75"
                }`}
              >
                <BadgeArtwork milestone={days} unlocked={isUnlocked} size="sm" />
                <span
                  className={`text-[10px] font-bold max-w-[58px] text-center leading-tight ${
                    isUnlocked ? "text-neu-dark" : "text-neu-muted"
                  }`}
                >
                  {meta.title}
                </span>
                {isUnlocked && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-neu-accent">
                    <Sparkles className="w-2.5 h-2.5" />
                    Share
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </NeuCard>
  );
};