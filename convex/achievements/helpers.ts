// convex/achievements/helpers.ts
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const STREAK_MILESTONES = [
  1, 3, 7, 14, 21, 30, 50, 100, 200, 365, 500, 1000,
] as const;

export type MilestoneDay = (typeof STREAK_MILESTONES)[number];

export type StreakLogInput = string | { date: string; isFrozen?: boolean };

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function calculateStreakStats(
  entries: Iterable<StreakLogInput>,
  todayDate: string,
): { currentStreak: number; longestStreak: number } {
  const completedSet = new Set<string>();
  const frozenSet = new Set<string>();

  for (const entry of entries) {
    if (typeof entry === "string") {
      completedSet.add(entry);
    } else if (entry.isFrozen) {
      frozenSet.add(entry.date);
    } else {
      completedSet.add(entry.date);
    }
  }

  if (completedSet.size === 0 && frozenSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const hasActivity = (date: string) =>
    completedSet.has(date) || frozenSet.has(date);

  // 1. Current streak: anchor at today if completed/frozen, otherwise yesterday
  const yesterdayDate = shiftDateKey(todayDate, -1);
  let cursor = hasActivity(todayDate)
    ? todayDate
    : hasActivity(yesterdayDate)
      ? yesterdayDate
      : null;

  let currentStreak = 0;
  while (cursor && hasActivity(cursor)) {
    // Only real completions add +1; frozen days bridge the streak without inflating count
    if (completedSet.has(cursor)) {
      currentStreak++;
    }
    cursor = shiftDateKey(cursor, -1);
  }

  // 2. Longest contiguous streak across all history
  const sortedDates = Array.from(new Set([...completedSet, ...frozenSet])).sort();
  let longestStreak = currentStreak;
  let running = 0;
  let prevDate: string | null = null;

  for (const d of sortedDates) {
    if (prevDate && shiftDateKey(prevDate, 1) === d) {
      if (completedSet.has(d)) running++;
    } else {
      running = completedSet.has(d) ? 1 : 0;
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
    prevDate = d;
  }

  return { currentStreak, longestStreak };
}

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