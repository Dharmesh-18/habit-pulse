// convex/achievements/helpers.ts
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const STREAK_MILESTONES = [
  1, 3, 7, 14, 21, 30, 50, 100, 200, 365, 500, 1000,
] as const;

export type MilestoneDay = (typeof STREAK_MILESTONES)[number];

/**
 * Shift a "YYYY-MM-DD" date string by `deltaDays` using pure UTC calendar math
 * (immune to DST or server timezone shifts).
 */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Computes current contiguous streak (ending at `todayDate` or `yesterdayDate`)
 * and all-time longest contiguous streak from a set of completed "YYYY-MM-DD" strings.
 */
export function calculateStreakStats(
  completedDates: Iterable<string>,
  todayDate: string,
): { currentStreak: number; longestStreak: number } {
  const dateSet = new Set(completedDates);
  if (dateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Current streak: anchor at today if completed, otherwise yesterday
  const yesterdayDate = shiftDateKey(todayDate, -1);
  let cursor = dateSet.has(todayDate)
    ? todayDate
    : dateSet.has(yesterdayDate)
      ? yesterdayDate
      : null;

  let currentStreak = 0;
  while (cursor && dateSet.has(cursor)) {
    currentStreak++;
    cursor = shiftDateKey(cursor, -1);
  }

  // 2. Longest contiguous streak across all history
  const sortedDates = Array.from(dateSet).sort(); // ISO YYYY-MM-DD sorts lexicographically
  let longestStreak = 0;
  let running = 0;
  let prevDate: string | null = null;

  for (const d of sortedDates) {
    if (prevDate && shiftDateKey(prevDate, 1) === d) {
      running++;
    } else {
      running = 1;
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
    prevDate = d;
  }

  return { currentStreak, longestStreak };
}

/**
 * Idempotently unlocks any milestones <= `streakToCheck` that haven't been saved yet.
 * Returns the newly unlocked milestone numbers (sorted ascending).
 */
export async function unlockEligibleMilestones(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    habitId: Id<"habits">;
    streakToCheck: number;
  },
): Promise<number[]> {
  const { userId, habitId, streakToCheck } = params;
  if (streakToCheck <= 0) return [];

  const existing = await ctx.db
    .query("habitAchievements")
    .withIndex("by_habit", (q) => q.eq("habitId", habitId))
    .collect();

  const unlockedSet = new Set(existing.map((a) => a.milestone));
  const newlyUnlocked: number[] = [];
  const now = Date.now();

  for (const milestone of STREAK_MILESTONES) {
    if (milestone <= streakToCheck && !unlockedSet.has(milestone)) {
      await ctx.db.insert("habitAchievements", {
        userId,
        habitId,
        milestone,
        unlockedAt: now,
      });
      newlyUnlocked.push(milestone);
    }
  }

  return newlyUnlocked;
}