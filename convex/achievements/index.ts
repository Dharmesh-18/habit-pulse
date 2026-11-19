// convex/achievements/index.ts
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { authenticate } from "../common/auth";
import {
  calculateStreakStats,
  STREAK_MILESTONES,
  unlockEligibleMilestones,
} from "./helpers";

export const listOverview = query({
  args: {
    sessionToken: v.string(),
    todayDate: v.string(), // User's local "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    const [habits, logs, achievements] = await Promise.all([
      ctx.db
        .query("habits")
        .withIndex("by_user", (q) =>
          q.eq("userId", user.userId).eq("isArchived", false),
        )
        .collect(),
      ctx.db
        .query("habitLogs")
        .withIndex("by_user_date", (q) => q.eq("userId", user.userId))
        .collect(),
      ctx.db
        .query("habitAchievements")
        .withIndex("by_user", (q) => q.eq("userId", user.userId))
        .collect(),
    ]);

    // Group completed dates by habitId
    const completedDatesByHabit = new Map<string, string[]>();
    for (const log of logs) {
      if (!log.completed) continue;
      const list = completedDatesByHabit.get(log.habitId) ?? [];
      list.push(log.date);
      completedDatesByHabit.set(log.habitId, list);
    }

    // Group unlocked achievements by habitId
    const achievementsByHabit = new Map<
      string,
      Array<{ milestone: number; unlockedAt: number }>
    >();
    for (const ach of achievements) {
      const list = achievementsByHabit.get(ach.habitId) ?? [];
      list.push({ milestone: ach.milestone, unlockedAt: ach.unlockedAt });
      achievementsByHabit.set(ach.habitId, list);
    }

    const items = habits.map((habit) => {
      const dates = completedDatesByHabit.get(habit._id) ?? [];
      const { currentStreak, longestStreak: computedLongest } =
        calculateStreakStats(dates, args.todayDate);

      const bestStreak = Math.max(
        habit.longestStreak ?? 0,
        computedLongest,
        currentStreak,
      );

      const unlocked = (achievementsByHabit.get(habit._id) ?? []).sort(
        (a, b) => a.milestone - b.milestone,
      );

      return {
        habitId: habit._id,
        title: habit.title,
        category: habit.category,
        currentStreak,
        longestStreak: bestStreak,
        unlockedMilestones: unlocked,
      };
    });

    const highestUnlockedMilestone = achievements.reduce(
      (max, a) => Math.max(max, a.milestone),
      0,
    );

    return {
      milestones: [...STREAK_MILESTONES],
      highestUnlockedMilestone,
      habits: items,
    };
  },
});

/**
 * Retroactively syncs badges for habits that already have streaks from before
 * the achievements system was deployed. Safe & idempotent.
 */
export const syncLegacyAchievements = mutation({
  args: {
    sessionToken: v.string(),
    todayDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    const [habits, logs] = await Promise.all([
      ctx.db
        .query("habits")
        .withIndex("by_user", (q) =>
          q.eq("userId", user.userId).eq("isArchived", false),
        )
        .collect(),
      ctx.db
        .query("habitLogs")
        .withIndex("by_user_date", (q) => q.eq("userId", user.userId))
        .collect(),
    ]);

    const completedDatesByHabit = new Map<string, string[]>();
    for (const log of logs) {
      if (!log.completed) continue;
      const list = completedDatesByHabit.get(log.habitId) ?? [];
      list.push(log.date);
      completedDatesByHabit.set(log.habitId, list);
    }

    for (const habit of habits) {
      const dates = completedDatesByHabit.get(habit._id) ?? [];
      const { longestStreak } = calculateStreakStats(
        dates,
        args.todayDate,
      );
      const bestStreak = Math.max(habit.longestStreak ?? 0, longestStreak);

      if (bestStreak > (habit.longestStreak ?? 0)) {
        await ctx.db.patch(habit._id, { longestStreak: bestStreak });
      }

      if (bestStreak > 0) {
        await unlockEligibleMilestones(ctx, {
          userId: user.userId,
          habitId: habit._id,
          streakToCheck: bestStreak,
        });
      }
    }

    return { synced: true };
  },
});