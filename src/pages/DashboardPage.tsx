// src/pages/DashboardPage.tsx
import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { NeuCard } from "../components/ui/NeuCard";
import { CreateHabitCard } from "../components/habit/CreateHabitCard";
import { HabitMatrix, type HabitItem } from "../components/habit/HabitMatrix";
import { ConsistencyGraphCard } from "../components/habit/ConsistencyGraphCard";
import { useToast } from "../context/ToastContext";
import { parseConvexError } from "../lib/errorUtils";

interface DashboardPageProps {
  sessionToken: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  sessionToken,
}) => {
  const toast = useToast();

  const habits = useQuery(
    api.habits.index.listWithLogs,
    sessionToken ? { sessionToken } : "skip"
  );

  // ⚡ 0ms Optimistic UI Update wired directly into Convex's local query cache
  const toggleTodayMutation = useMutation(
    api.habits.index.toggleToday
  ).withOptimisticUpdate((localStore, args) => {
    const currentHabits = localStore.getQuery(api.habits.index.listWithLogs, {
      sessionToken: args.sessionToken,
    });

    if (currentHabits !== undefined) {
      const updatedHabits = currentHabits.map((habit) => {
        if (habit._id !== args.habitId) return habit;

        const currentlyCompleted = Boolean(habit.logs?.[args.date]);
        return {
          ...habit,
          logs: {
            ...habit.logs,
            [args.date]: !currentlyCompleted,
          },
        };
      });

      localStore.setQuery(
        api.habits.index.listWithLogs,
        { sessionToken: args.sessionToken },
        updatedHabits
      );
    }
  });

  const updateHabitMutation = useMutation(
    api.habits.index.updateWithVersionCheck
  );
  const deleteHabitMutation = useMutation(api.habits.index.remove);

  const handleToggleDate = async (id: string, date: string) => {
    if (!habits) return;
    const targetHabit = habits.find((h) => h._id === id);
    const willBeDone = !Boolean(targetHabit?.logs?.[date]);

    try {
      await toggleTodayMutation({
        sessionToken,
        habitId: id as Id<"habits">,
        date,
      });

      if (willBeDone) {
        toast.success(`Marked "${targetHabit?.title}" done (${date})`);
      } else {
        toast.info(`Unmarked "${targetHabit?.title}" (${date})`);
      }
    } catch (err: unknown) {
      // Note: Convex automatically rolls back the optimistic checkbox state on error!
      toast.error(parseConvexError(err));
    }
  };

  const handleUpdateHabit = async (
    id: string,
    title: string,
    category: string,
    expectedVersion: number
  ) => {
    await updateHabitMutation({
      sessionToken,
      habitId: id as Id<"habits">,
      title,
      category,
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