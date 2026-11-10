// convex/habits/index.ts
import { mutation, query, internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { authenticate } from "../common/auth";
import { assertRateLimit } from "../common/rateLimiter";
import { internal } from "../_generated/api";

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

    // SCHEDULER TRIGGER (Demonstrating runAfter background scheduling)
    if (args.reminderTime) {
      const targetTimestamp = calculateNextReminderTimestamp(
        args.reminderTime,
        args.timezoneOffset ?? 0,
      );

      console.log(
        `[SCHEDULED] Reminder for "${args.title}" at: ${new Date(targetTimestamp).toISOString()} (in ${Math.round((targetTimestamp - Date.now()) / 1000)}s)`,
      );

      await ctx.scheduler.runAt(
        targetTimestamp,
        internal.jobs.reminders.processReminderAction,
        {
          habitId,
          userEmail: user.email,
          title: args.title,
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
    expectedVersion: v.number(), // The version the client saw before editing
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

    // Bump version atomically
    const nextVersion = habit.version + 1;
    await ctx.db.patch(habit._id, {
      title: args.title.trim(),
      normalizedTitle,
      category: args.category,
      version: nextVersion,
      updatedAt: Date.now(),
    });

    return { success: true, newVersion: nextVersion };
  },
});

// 4. MUTATION: Toggle Completion Log (Idempotent)
export const toggleToday = mutation({
  args: {
    sessionToken: v.string(),
    habitId: v.id("habits"),
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    const existingLog = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date),
      )
      .first();

    if (existingLog) {
      const nextStatus = !existingLog.completed;
      await ctx.db.patch(existingLog._id, {
        completed: nextStatus,
        timestamp: Date.now(),
      });
      return nextStatus;
    } else {
      await ctx.db.insert("habitLogs", {
        habitId: args.habitId,
        userId: user.userId,
        date: args.date,
        completed: true,
        timestamp: Date.now(),
      });
      return true;
    }
  },
});

function calculateNextReminderTimestamp(
  timeStr: string,
  timezoneOffsetMinutes: number = 0,
): number {
  const [targetHours, targetMinutes] = timeStr.split(":").map(Number);

  // 1. Current UTC time
  const now = new Date();

  // 2. Client ka current local time nikalen
  // getTimezoneOffset() gives minutes subtracted from UTC to get local (IST is -330)
  const clientNowMs = now.getTime() - timezoneOffsetMinutes * 60 * 1000;
  const clientNow = new Date(clientNowMs);

  // 3. Client ke date par target time set karein
  const targetLocal = new Date(clientNow);
  targetLocal.setUTCHours(targetHours, targetMinutes, 0, 0);

  // Agar target time aaj nikal chuka hai, to next day schedule karein
  if (targetLocal.getTime() <= clientNow.getTime()) {
    targetLocal.setUTCDate(targetLocal.getUTCDate() + 1);
  }

  // 4. Client local time ko wapas true UTC epoch ms me convert karein
  const targetUtcMs = targetLocal.getTime() + timezoneOffsetMinutes * 60 * 1000;

  return targetUtcMs;
}

// 5. INTERNAL MUTATION: Used by background crons/workers only
export const internalResetHabitFlags = internalMutation({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    // Accessible only from cron or actions, NOT exposed to frontend api
    console.log(
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
