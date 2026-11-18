// src/pages/AchievementsPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Award, Flame, Trophy } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { getTodayKey } from "../lib/utils";
import { NeuCard } from "../components/ui/NeuCard";
import { HabitAchievementRow } from "../components/achievements/HabitAchievementRow";
import {
  AchievementShareModal,
  type SelectedAchievement,
} from "../components/achievements/AchievementShareModal";

interface AchievementsPageProps {
  sessionToken: string;
}

export const AchievementsPage: React.FC<AchievementsPageProps> = ({
  sessionToken,
}) => {
  const todayKey = getTodayKey();
  const hasSyncedRef = useRef(false);
  const [selectedBadge, setSelectedBadge] =
    useState<SelectedAchievement | null>(null);

  const overview = useQuery(api.achievements.index.listOverview, {
    sessionToken,
    todayDate: todayKey,
  });

  const syncLegacy = useMutation(api.achievements.index.syncLegacyAchievements);

  // Retroactively unlock badges for pre-existing streaks once per session
  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    syncLegacy({ sessionToken, todayDate: todayKey }).catch(() => {});
  }, [sessionToken, todayKey, syncLegacy]);

  const habits = overview?.habits ?? [];
  const milestones = overview?.milestones ?? [];

  const totalUnlocked = habits.reduce(
    (sum, h) => sum + h.unlockedMilestones.length,
    0,
  );
  const highestStreak = habits.reduce(
    (max, h) => Math.max(max, h.longestStreak),
    0,
  );

  return (
    <div className="w-full flex flex-col gap-6 pb-20 md:pb-6">
      {/* Summary Hero Banner */}
      <NeuCard className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-neu-dark tracking-tight">
              Streak Achievements
            </h1>
            <p className="text-xs text-neu-muted mt-0.5">
              Tap any unlocked medallion to generate and share your streak card.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-sm font-black text-neu-dark leading-none">
                {totalUnlocked}
              </p>
              <p className="text-[10px] font-semibold text-neu-muted mt-0.5">
                Badges Earned
              </p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <div>
              <p className="text-sm font-black text-neu-dark leading-none">
                {highestStreak}d
              </p>
              <p className="text-[10px] font-semibold text-neu-muted mt-0.5">
                All-Time Best
              </p>
            </div>
          </div>
        </div>
      </NeuCard>

      {/* Habit Streak Tracks */}
      {overview === undefined ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-44 rounded-3xl bg-neu-bg shadow-neu-flat animate-pulse"
            />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <NeuCard className="p-10 text-center flex flex-col items-center gap-2">
          <Award className="w-10 h-10 text-neu-muted/50" />
          <p className="text-sm font-bold text-neu-dark">No active habits yet</p>
          <p className="text-xs text-neu-muted max-w-xs">
            Create a habit on your Dashboard and check in daily to start
            unlocking milestone badges!
          </p>
        </NeuCard>
      ) : (
        <div className="flex flex-col gap-4">
          {habits.map((item) => (
            <HabitAchievementRow
              key={item.habitId}
              item={item}
              milestones={milestones}
              onSelectBadge={(milestone, unlockedAt) =>
                setSelectedBadge({
                  habitTitle: item.title,
                  category: item.category,
                  milestone,
                  unlockedAt,
                })
              }
            />
          ))}
        </div>
      )}

      <AchievementShareModal
        achievement={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
};