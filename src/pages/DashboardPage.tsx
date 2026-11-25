// src/pages/DashboardPage.tsx
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { NeuCard } from "../components/ui/NeuCard";
import { ConfirmActionModal } from "../components/ui/ConfirmActionModal";
import { CreateHabitCard } from "../components/habit/CreateHabitCard";
import { HabitMatrix, type HabitItem } from "../components/habit/HabitMatrix";
import { ConsistencyGraphCard } from "../components/habit/ConsistencyGraphCard";
import { useToast } from "../context/ToastContext";
import { parseConvexError } from "../lib/errorUtils";
import { getMilestoneMeta } from "../lib/achievements";
import { soundFX } from "../lib/soundEffects";
import { getThemesUnlockedAtMilestone } from "../lib/themes";

interface DashboardPageProps {
  sessionToken: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  sessionToken,
}) => {
  const toast = useToast();
  const navigate = useNavigate();

  const [freezeTarget, setFreezeTarget] = useState<{
    habit: HabitItem;
    date: string;
    yesterdayDate: string;
    dayBeforeYesterdayDate: string;
  } | null>(null);
  const [isFreezing, setIsFreezing] = useState(false);

  const habits = useQuery(
    api.habits.index.listWithLogs,
    sessionToken ? { sessionToken } : "skip",
  );

  const wallet = useQuery(
    api.shop.index.getMyWallet,
    sessionToken ? { sessionToken } : "skip",
  );

  // ⚡ 0ms One-Way Optimistic UI Update
  const toggleTodayMutation = useMutation(
    api.habits.index.toggleToday,
  ).withOptimisticUpdate((localStore, args) => {
    const currentHabits = localStore.getQuery(api.habits.index.listWithLogs, {
      sessionToken: args.sessionToken,
    });

    if (currentHabits !== undefined) {
      const updatedHabits = currentHabits.map((habit) => {
        if (habit._id !== args.habitId) return habit;

        return {
          ...habit,
          logs: {
            ...habit.logs,
            [args.date]: true,
          },
        };
      });

      localStore.setQuery(
        api.habits.index.listWithLogs,
        { sessionToken: args.sessionToken },
        updatedHabits,
      );
    }
  });

  const useStreakFreezeMutation = useMutation(
    api.habits.index.useStreakFreeze,
  );
  const updateHabitMutation = useMutation(
    api.habits.index.updateWithVersionCheck,
  );
  const deleteHabitMutation = useMutation(api.habits.index.remove);

  const handleToggleDate = async (id: string, date: string) => {
    if (!habits) return;
    const targetHabit = habits.find((h) => h._id === id);

    if (targetHabit?.logs?.[date]) {
      return;
    }

    try {
      const result = await toggleTodayMutation({
        sessionToken,
        habitId: id as Id<"habits">,
        date,
      });
      soundFX.checkHabit();

      const unlocked = result?.newlyUnlockedMilestones ?? [];
      const firstTimeGlobal = result?.firstTimeUserMilestones ?? [];

      if (unlocked.length > 0) {
        const highestMilestone = unlocked[unlocked.length - 1];
        const meta = getMilestoneMeta(highestMilestone);

        const newlyUnlockedThemes = firstTimeGlobal.flatMap((m) =>
          getThemesUnlockedAtMilestone(m),
        );

        soundFX.achievementUnlock();

        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.65 },
        });

        if (newlyUnlockedThemes.length > 0) {
          toast.success(
            `🎉 ${highestMilestone}-Day Streak ("${meta.title}") + New Theme Unlocked: "${newlyUnlockedThemes[0].label}"!`,
          );
        } else {
          toast.success(
            `🎉 ${highestMilestone}-Day Streak Unlocked: "${meta.title}"! View in Achievements.`,
          );
        }
      } else {
        toast.success(`Marked "${targetHabit?.title}" done (${date})`);
      }

      return result;
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    }
  };

  const handleOpenFreezeModal = (
    habit: HabitItem,
    date: string,
    yesterdayDate: string,
    dayBeforeYesterdayDate: string,
  ) => {
    const shields = wallet?.shields ?? 0;
    if (shields < 1) {
      toast.error(
        "No Streak Freeze Shields left! Get one in the Shop (75 Coins).",
      );
      navigate("/shop");
      return;
    }

    setFreezeTarget({
      habit,
      date,
      yesterdayDate,
      dayBeforeYesterdayDate,
    });
  };

  const handleConfirmFreeze = async () => {
    if (!freezeTarget) return;
    try {
      setIsFreezing(true);
      const res = await useStreakFreezeMutation({
        sessionToken,
        habitId: freezeTarget.habit._id as Id<"habits">,
        date: freezeTarget.date,
        yesterdayDate: freezeTarget.yesterdayDate,
        dayBeforeYesterdayDate: freezeTarget.dayBeforeYesterdayDate,
      });
      soundFX.achievementUnlock();
      toast.success(
        `❄️ Streak saved for "${res.habitTitle}"! (${res.remainingShields}/3 shields left)`,
      );
      setFreezeTarget(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsFreezing(false);
    }
  };

  const handleUpdateHabit = async (
    id: string,
    title: string,
    category: string,
    expectedVersion: number,
    reminderTime?: string,
  ) => {
    await updateHabitMutation({
      sessionToken,
      habitId: id as Id<"habits">,
      title,
      category,
      reminderTime,
      timezoneOffset: new Date().getTimezoneOffset(),
      expectedVersion,
    });
    toast.success(`Updated "${title}"`);
  };

  const handleDeleteHabit = async (id: string) => {
    if (!habits) return;
    const targetHabit = habits.find((h) => h._id === id);
    await deleteHabitMutation({
      sessionToken,
      habitId: id as Id<"habits">,
    });
    soundFX.deleteHabit();
    toast.success(`Habit "${targetHabit?.title}" deleted`);
  };

  return (
    <div className="flex flex-col gap-8">
      <CreateHabitCard sessionToken={sessionToken} />

      <main className="flex flex-col gap-8 relative z-10">
        {habits === undefined ? (
          <p className="text-xs text-neu-muted text-center py-8">
            Syncing with Convex backend...
          </p>
        ) : habits.length === 0 ? (
          <NeuCard inset className="text-center py-12 text-neu-muted text-sm">
            No habits yet. Add your first habit above to begin tracking.
          </NeuCard>
        ) : (
          <>
            <HabitMatrix
              habits={habits as unknown as HabitItem[]}
              onToggleDate={handleToggleDate}
              onFreezeDate={handleOpenFreezeModal}
              onUpdate={handleUpdateHabit}
              onDelete={handleDeleteHabit}
            />

            <ConsistencyGraphCard habits={habits as unknown as HabitItem[]} />
          </>
        )}
      </main>

      {/* Streak Freeze Shield Confirmation Modal */}
      <ConfirmActionModal
        isOpen={freezeTarget !== null}
        variant="primary"
        title="Use Streak Freeze Shield? ❄️"
        description={`Use 1 Streak Freeze Shield (${wallet?.shields ?? 0}/3 available) to protect "${freezeTarget?.habit.title}" for yesterday (${freezeTarget?.date})? Your streak stays intact and advances once you complete today!`}
        confirmLabel="Apply Freeze Shield"
        isLoading={isFreezing}
        onConfirm={handleConfirmFreeze}
        onCancel={() => setFreezeTarget(null)}
      />
    </div>
  );
};