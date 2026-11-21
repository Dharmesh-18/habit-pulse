// convex/reports/aggregator.ts
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export interface HabitBreakdownItem {
  habitId: string;
  title: string;
  category: string;
  reminderTime?: string;
  completedDays: number;
  scheduledDays: number;
  completionRate: number; // 0-100
  currentStreak: number;
  longestStreak: number;
}

export interface AggregatedHabitStats {
  userName: string;
  period: "week" | "month";
  periodLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  activeHabitsCount: number;
  totalCompletions: number;
  totalPossible: number;
  overallCompletionRate: number; // 0-100
  bestDayOfWeek: string;
  weakestDayOfWeek: string;
  habits: HabitBreakdownItem[];
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getPastDates(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)
    );
    dates.push(formatUtcDate(d));
  }
  return dates;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const getReportDataset = internalQuery({
  args: {
    sessionToken: v.string(),
    period: v.union(v.literal("week"), v.literal("month")),
  },
  handler: async (ctx, args): Promise<AggregatedHabitStats | null> => {
    if (!args.sessionToken) return null;

    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const totalDays = args.period === "week" ? 7 : 30;
    const windowDates = getPastDates(totalDays);
    const startDate = windowDates[0];
    const endDate = windowDates[windowDates.length - 1];

    const activeHabits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) =>
        q.eq("userId", user._id).eq("isArchived", false)
      )
      .collect();

    const logsInRange = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", startDate).lte("date", endDate)
      )
      .collect();

    const completedSet = new Set<string>();
    const dayOfWeekCounts = new Array<number>(7).fill(0);

    for (const log of logsInRange) {
      if (log.completed) {
        completedSet.add(`${log.habitId}:${log.date}`);
        const dayIdx = new Date(`${log.date}T00:00:00Z`).getUTCDay();
        dayOfWeekCounts[dayIdx] += 1;
      }
    }

    const habitsBreakdown: HabitBreakdownItem[] = activeHabits.map((habit) => {
      let completedDays = 0;
      let currentStreak = 0;

      for (const dateStr of windowDates) {
        if (completedSet.has(`${habit._id}:${dateStr}`)) {
          completedDays += 1;
        }
      }

      // Trailing streak within the inspected window
      for (let i = windowDates.length - 1; i >= 0; i--) {
        if (completedSet.has(`${habit._id}:${windowDates[i]}`)) {
          currentStreak += 1;
        } else {
          break;
        }
      }

      const completionRate =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      return {
        habitId: habit._id,
        title: habit.title,
        category: habit.category,
        reminderTime: habit.reminderTime,
        completedDays,
        scheduledDays: totalDays,
        completionRate,
        currentStreak,
        longestStreak: Math.max(habit.longestStreak ?? 0, currentStreak),
      };
    });

    habitsBreakdown.sort((a, b) => b.completionRate - a.completionRate);

    const totalCompletions = habitsBreakdown.reduce(
      (acc, h) => acc + h.completedDays,
      0
    );
    const totalPossible = activeHabits.length * totalDays;
    const overallCompletionRate =
      totalPossible > 0
        ? Math.round((totalCompletions / totalPossible) * 100)
        : 0;

    let bestDayIdx = 0;
    let weakestDayIdx = 0;
    for (let i = 1; i < 7; i++) {
      if (dayOfWeekCounts[i] > dayOfWeekCounts[bestDayIdx]) bestDayIdx = i;
      if (dayOfWeekCounts[i] < dayOfWeekCounts[weakestDayIdx]) weakestDayIdx = i;
    }

    return {
      userName: user.name,
      period: args.period,
      periodLabel:
        args.period === "week"
          ? "Last 7 Days (Weekly Review)"
          : "Last 30 Days (Monthly Review)",
      startDate,
      endDate,
      totalDays,
      activeHabitsCount: activeHabits.length,
      totalCompletions,
      totalPossible,
      overallCompletionRate,
      bestDayOfWeek: totalCompletions > 0 ? DAY_NAMES[bestDayIdx] : "N/A",
      weakestDayOfWeek: totalCompletions > 0 ? DAY_NAMES[weakestDayIdx] : "N/A",
      habits: habitsBreakdown,
    };
  },
});