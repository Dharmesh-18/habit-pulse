// convex/habits/reminders.ts
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { getReminderMessage } from "../notifications/copy";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getNextDateKey(currentDateStr: string): string {
  const [year, month, day] = currentDateStr.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const yyyy = nextDate.getUTCFullYear();
  const mm = String(nextDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(nextDate.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const getHabitReminderStatus = internalQuery({
  args: {
    habitId: v.id("habits"),
    todayDate: v.string(),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    // Agar habit delete ya archive ho chuki hai, to null return hoga
    if (!habit || habit.isArchived || !habit.reminderTime) return null;

    const user = await ctx.db.get(habit.userId);

    const log = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.todayDate),
      )
      .first();

    return {
      userId: habit.userId,
      title: habit.title,
      category: habit.category,
      reminderTime: habit.reminderTime,
      userName: user?.name,
      isCompleted: log?.completed === true,
    };
  },
});

export const sendHabitReminder = internalAction({
  args: {
    habitId: v.id("habits"),
    userEmail: v.string(),
    todayDate: v.string(),
    scheduledTimestamp: v.optional(v.number()),
    expectedReminderTime: v.optional(v.string()), // Stale job guard
  },
  handler: async (ctx, args) => {
    const status = await ctx.runQuery(
      internal.jobs.reminders.getHabitReminderStatus,
      {
        habitId: args.habitId,
        todayDate: args.todayDate,
      },
    );

    // 1. Stop chain permanently if habit was deleted, archived, or reminder cleared
    if (!status) {
      console.log(
        `[ReminderChain] Stopped for habit ${args.habitId} (deleted/archived/no reminder).`,
      );
      return;
    }

    // 2. Self-Invalidation Guard: Ignore stale jobs from an older reminderTime
    if (
      args.expectedReminderTime &&
      args.expectedReminderTime !== status.reminderTime
    ) {
      console.log(
        `[ReminderChain] Ignoring stale job (${args.expectedReminderTime}) for "${status.title}" — active time is now ${status.reminderTime}.`,
      );
      return;
    }

    // 3. Send email only if habit isn't completed today
    if (!status.isCompleted) {
      const pushBody = getReminderMessage({
        title: status.title,
        category: status.category,
        reminderTime: status.reminderTime,
        userName: status.userName,
      });

      await Promise.allSettled([
        ctx.runAction(
          internal.notifications.actions.sendHabitReminderNotification,
          {
            userId: status.userId,
            email: args.userEmail,
            userName: status.userName,
            habitTitle: status.title,
            category: status.category,
            reminderTime: status.reminderTime,
          }
        ),
        ctx.runAction(internal.notifications.webPush.sendPushToUser, {
          userId: status.userId,
          title: `⏰ ${status.title}`,
          body: pushBody,
          url: "/",
          tag: `habit-${args.habitId}`,
        }),
      ]);
    } else {
      console.log(
        `[ReminderChain] Habit "${status.title}" already completed for ${args.todayDate}. Skipping email.`,
      );
    }

    // 4. Schedule tomorrow's reminder with current active reminderTime
    const baseTime = args.scheduledTimestamp ?? Date.now();
    const nextTimestamp = baseTime + ONE_DAY_MS;
    const tomorrowDateKey = getNextDateKey(args.todayDate);

    await ctx.scheduler.runAt(
      nextTimestamp,
      internal.jobs.reminders.sendHabitReminder,
      {
        habitId: args.habitId,
        userEmail: args.userEmail,
        todayDate: tomorrowDateKey,
        scheduledTimestamp: nextTimestamp,
        expectedReminderTime: status.reminderTime,
      },
    );

    console.log(
      `[ReminderChain] Scheduled next reminder for "${status.title}" on ${tomorrowDateKey} at ${status.reminderTime}`,
    );
  },
});

export const triggerDailyReminders = internalAction({
  args: {},
  handler: async () => {
    console.log(
      "[CRON] Hourly health check executed at",
      new Date().toISOString(),
    );
  },
});
