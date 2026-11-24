// convex/habits/index.ts
import { internalMutation, mutation, query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { authenticate } from "../common/auth";
import { assertRateLimit } from "../common/rateLimiter";
import { internal } from "../_generated/api";
import { calculateStreakStats, unlockEligibleMilestones } from "../achievements/helpers";

import {
  HABIT_COMPLETION_COINS,
  HABIT_COMPLETION_XP,
  computeMilestoneBonusCoins,
  creditWalletActivity,
} from "../shop/helpers";

// 1. QUERY: Get Habits with Last 30 Days Heatmap Logs
export const listWithLogs = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) =>
        q.eq("userId", user.userId).eq("isArchived", false),
      )
      .collect();

    // Fetch last 30 days logs
    const habitIds = new Set(habits.map((h) => h._id));
    const allUserLogs = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user.userId))
      .collect();

    // Group logs by habitId
    const logsByHabit = new Map<string, Record<string, boolean>>();
    for (const log of allUserLogs) {
      if (habitIds.has(log.habitId)) {
        const idStr = log.habitId;
        if (!logsByHabit.has(idStr)) {
          logsByHabit.set(idStr, {});
        }
        logsByHabit.get(idStr)![log.date] = log.completed;
      }
    }

    return habits.map((habit) => ({
      ...habit,
      logs: logsByHabit.get(habit._id) ?? {},
    }));
  },
});

// 2. MUTATION: Create Habit with Deduplication
export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    category: v.string(),
    reminderTime: v.optional(v.string()),
    timezoneOffset: v.optional(v.number()),
    customImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    // Rate limiting: max 15 creates per minute
    await assertRateLimit(ctx, {
      key: `createHabit:${user.userId}`,
      maxRequests: 15,
      windowMs: 60 * 1000,
    });

    const normalizedTitle = args.title.trim().toLowerCase();

    // Length validation
    if (normalizedTitle.length < 3) {
      throw new Error("Habit name must be at least 3 characters long.");
    }
    if (normalizedTitle.length > 30) {
      throw new Error("Habit name cannot exceed 30 characters.");
    }

    // DEDUPLICATION CHECK
    const existingActive = await ctx.db
      .query("habits")
      .withIndex("by_user_title", (q) =>
        q.eq("userId", user.userId).eq("normalizedTitle", normalizedTitle),
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .first();

    if (existingActive) {
      throw new ConvexError(
        `Duplicate habit: "${args.title}" is already an active habit.`,
      );
    }

    const now = Date.now();
    const habitId = await ctx.db.insert("habits", {
      userId: user.userId,
      title: args.title.trim(),
      normalizedTitle,
      category: args.category,
      reminderTime: args.reminderTime,
      customImageStorageId: args.customImageStorageId,
      version: 1,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    const userDoc = await ctx.db.get(user.userId);

    // 1. Immediate Confirmation Email (Non-blocking background execution)
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.actions.sendHabitCreatedNotification,
      {
        userId: user.userId,
        email: user.email,
        userName: userDoc?.name,
        habitTitle: args.title.trim(),
        category: args.category,
        reminderTime: args.reminderTime,
      },
    );

    // 2. Scheduled Daily Reminder Email (if reminderTime is provided)
    if (args.reminderTime) {
      const { scheduledTimestamp, targetDateKey } = computeNextReminderSchedule(
        args.reminderTime,
        args.timezoneOffset ?? -330,
      );

      await ctx.scheduler.runAt(
        scheduledTimestamp,
        internal.jobs.reminders.sendHabitReminder,
        {
          habitId,
          userEmail: user.email,
          todayDate: targetDateKey,
          scheduledTimestamp,
          expectedReminderTime: args.reminderTime,
        },
      );
    }

    return habitId;
  },
});

// 3. MUTATION: Update with Conflict Check (Optimistic Concurrency Control)
export const updateWithVersionCheck = mutation({
  args: {
    sessionToken: v.string(),
    habitId: v.id("habits"),
    title: v.string(),
    category: v.string(),
    reminderTime: v.optional(v.string()),
    timezoneOffset: v.optional(v.number()),
    expectedVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== user.userId) {
      throw new ConvexError("Habit not found or unauthorized");
    }

    // CONFLICT OCC CHECK
    if (habit.version !== args.expectedVersion) {
      throw new ConvexError(
        `CONFLICT: This habit was updated in another window. Current: v${habit.version}, yours: v${args.expectedVersion}. Please reload.`,
      );
    }

    const normalizedTitle = args.title.trim().toLowerCase();

    // Dedup check on rename
    if (normalizedTitle !== habit.normalizedTitle) {
      const duplicate = await ctx.db
        .query("habits")
        .withIndex("by_user_title", (q) =>
          q.eq("userId", user.userId).eq("normalizedTitle", normalizedTitle),
        )
        .filter((q) => q.eq(q.field("isArchived"), false))
        .first();

      if (duplicate && duplicate._id !== habit._id) {
        throw new ConvexError(`Habit name "${args.title}" already taken.`);
      }
    }

    const normalizedReminderTime = args.reminderTime?.trim() || undefined;
    const isReminderChanged = normalizedReminderTime !== habit.reminderTime;

    // Bump version atomically
    const nextVersion = habit.version + 1;
    await ctx.db.patch(habit._id, {
      title: args.title.trim(),
      normalizedTitle,
      category: args.category,
      reminderTime: normalizedReminderTime,
      version: nextVersion,
      updatedAt: Date.now(),
    });

    // Reschedule only if reminderTime actually changed and is non-empty
    if (isReminderChanged && normalizedReminderTime) {
      const { scheduledTimestamp, targetDateKey } = computeNextReminderSchedule(
        normalizedReminderTime,
        args.timezoneOffset ?? -330,
      );

      await ctx.scheduler.runAt(
        scheduledTimestamp,
        internal.jobs.reminders.sendHabitReminder,
        {
          habitId: habit._id,
          userEmail: user.email,
          todayDate: targetDateKey,
          scheduledTimestamp,
          expectedReminderTime: normalizedReminderTime,
        },
      );
    }

    return { success: true, newVersion: nextVersion };
  },
});

// 4. MUTATION: Mark Habit Completed for Date (One-Way Immutable Lock + Streak/Milestone Check)
export const toggleToday = mutation({
  args: {
    sessionToken: v.string(),
    habitId: v.id("habits"),
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    await assertRateLimit(ctx, {
      key: `toggle_habit:${user.userId}`,
      maxRequests: 30,
      windowMs: 60 * 1000,
    });

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== user.userId || habit.isArchived) {
      throw new ConvexError("Unauthorized");
    }

    const existingLog = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date),
      )
      .first();

    // One-way lock: if already completed, prevent unchecking
    if (existingLog?.completed) {
      return {
        completed: true,
        alreadyCompleted: true,
        currentStreak: 0,
        longestStreak: habit.longestStreak ?? 0,
        newlyUnlockedMilestones: [] as number[],
        firstTimeUserMilestones: [] as number[],
      };
    }

    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        completed: true,
        timestamp: Date.now(),
      });
    } else {
      await ctx.db.insert("habitLogs", {
        habitId: args.habitId,
        userId: user.userId,
        date: args.date,
        completed: true,
        timestamp: Date.now(),
      });
    }

    // Recompute streak stats for this habit
    const habitLogs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) => q.eq("habitId", args.habitId))
      .collect();

    const completedDates = habitLogs
      .filter((l) => l.completed)
      .map((l) => l.date);

    const { currentStreak, longestStreak } = calculateStreakStats(
      completedDates,
      args.date,
    );

    const nextLongest = Math.max(habit.longestStreak ?? 0, longestStreak);
    if (nextLongest !== (habit.longestStreak ?? 0)) {
      await ctx.db.patch(habit._id, { longestStreak: nextLongest });
    }

    // Check milestones already unlocked across ANY habit for this user
    const existingUserAchievements = await ctx.db
      .query("habitAchievements")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .collect();

    const previouslyReachedMilestones = new Set<number>(
      existingUserAchievements.map((a) => a.milestone),
    );

    // Unlock per-habit milestones
    const newlyUnlockedMilestones = await unlockEligibleMilestones(ctx, {
      userId: user.userId,
      habitId: habit._id,
      streakToCheck: currentStreak,
    });

    // Filter only brand-new global milestones (for account-wide theme unlocks)
    const firstTimeUserMilestones = newlyUnlockedMilestones.filter(
      (m) => !previouslyReachedMilestones.has(m),
    );

    const milestoneBonus = computeMilestoneBonusCoins(newlyUnlockedMilestones);
    const totalCoinsEarned = HABIT_COMPLETION_COINS + milestoneBonus;

    await creditWalletActivity(ctx, {
      userId: user.userId,
      coinsToAdd: totalCoinsEarned,
      xpToAdd: HABIT_COMPLETION_XP,
    });

    return {
      completed: true,
      alreadyCompleted: false,
      currentStreak,
      longestStreak: nextLongest,
      newlyUnlockedMilestones,
      firstTimeUserMilestones,
      coinsEarned: totalCoinsEarned,
      xpEarned: HABIT_COMPLETION_XP,
    };
  },
});

// 5. INTERNAL MUTATION: Used by background crons/workers only
export const internalResetHabitFlags = internalMutation({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    // Accessible only from cron or actions, NOT exposed to frontend api
    console.log(
      ctx.auth.getUserIdentity() +
        `[CRON RUN] Checking logs integrity for habit: ${args.habitId}`,
    );
  },
});

// Add this inside convex/habits/index.ts

export const remove = mutation({
  args: {
    sessionToken: v.string(),
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== user.userId) {
      throw new ConvexError("Habit not found or unauthorized");
    }

    // Soft delete so active list & dedup index remain clean
    await ctx.db.patch(habit._id, {
      isArchived: true,
      updatedAt: Date.now(),
    });

    return { success: true, title: habit.title };
  },
});

function computeNextReminderSchedule(
  reminderTime: string,
  timezoneOffset: number = -330,
): { scheduledTimestamp: number; targetDateKey: string } {
  const [hours, minutes] = reminderTime.split(":").map(Number);
  const nowMs = Date.now();
  const offsetMs = timezoneOffset * 60 * 1000;
  const userLocalNow = new Date(nowMs - offsetMs);

  const targetLocal = new Date(userLocalNow);
  targetLocal.setUTCHours(hours, minutes, 0, 0);

  let scheduledTimestamp = targetLocal.getTime() + offsetMs;

  // If target time has already passed today in user's local timezone, schedule for tomorrow
  if (scheduledTimestamp <= nowMs) {
    scheduledTimestamp += 24 * 60 * 60 * 1000;
    targetLocal.setUTCDate(targetLocal.getUTCDate() + 1);
  }

  const yyyy = targetLocal.getUTCFullYear();
  const mm = String(targetLocal.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(targetLocal.getUTCDate()).padStart(2, "0");

  return {
    scheduledTimestamp,
    targetDateKey: `${yyyy}-${mm}-${dd}`,
  };
}
