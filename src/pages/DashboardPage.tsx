// src/pages/DashboardPage.tsx
import React from "react";
import { useQuery, useMutation } from "convex/react";
import confetti from "canvas-confetti";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { NeuCard } from "../components/ui/NeuCard";
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

  const habits = useQuery(
    api.habits.index.listWithLogs,
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

  const updateHabitMutation = useMutation(
    api.habits.index.updateWithVersionCheck,
  );
  const deleteHabitMutation = useMutation(api.habits.index.remove);

  const handleToggleDate = async (id: string, date: string) => {
    if (!habits) return;
    const targetHabit = habits.find((h) => h._id === id);

    // One-way guard: already completed habits cannot be unchecked
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

        // Sirf tabhi theme unlock check karo jab user ne ye milestone pehli baar hit kiya ho
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
              onUpdate={handleUpdateHabit}
              onDelete={handleDeleteHabit}
            />

            <ConsistencyGraphCard habits={habits as unknown as HabitItem[]} />
          </>
        )}
      </main>
    </div>
  );
};
