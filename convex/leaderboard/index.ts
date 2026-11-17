// convex/leaderboard/index.ts
import { query } from "../_generated/server";
import { v } from "convex/values";
import { authenticate } from "../common/auth";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarStorageId?: string;
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  rank: number;
  isCurrentUser: boolean;
}

export const getTopPerformers = query({
  args: {
    sessionToken: v.string(),
    date: v.string(), // Local "YYYY-MM-DD"
  },
  handler: async (ctx, args): Promise<LeaderboardEntry[]> => {
    const currentUser = await authenticate(ctx, args.sessionToken);

    // 1. Fetch all active (non-archived) habits across all users
    const allActiveHabits = await ctx.db
      .query("habits")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    // Group active habit count by userId
    const totalHabitsByUser = new Map<string, number>();
    const activeHabitIds = new Set<string>();

    for (const habit of allActiveHabits) {
      const uid = habit.userId;
      totalHabitsByUser.set(uid, (totalHabitsByUser.get(uid) ?? 0) + 1);
      activeHabitIds.add(habit._id);
    }

    // 2. Fetch today's completed logs
    const todaysLogs = await ctx.db
      .query("habitLogs")
      .filter((q) =>
        q.and(
          q.eq(q.field("date"), args.date),
          q.eq(q.field("completed"), true)
        )
      )
      .collect();

    const completedByUser = new Map<string, number>();
    for (const log of todaysLogs) {
      // Count only if the habit is still active (not deleted/archived)
      if (activeHabitIds.has(log.habitId)) {
        const uid = log.userId;
        completedByUser.set(uid, (completedByUser.get(uid) ?? 0) + 1);
      }
    }

    // 3. Fetch all users who have at least 1 active habit
    const allUsers = await ctx.db.query("users").collect();

    const rawEntries = allUsers
      .map((u) => {
        const totalTasks = totalHabitsByUser.get(u._id) ?? 0;
        if (totalTasks === 0) return null; // Exclude users with 0 active habits

        const completedTasks = Math.min(
          completedByUser.get(u._id) ?? 0,
          totalTasks
        );
        const percentage = Math.round((completedTasks / totalTasks) * 100);

        return {
          userId: u._id,
          name: u.name,
          avatarStorageId: u.avatarStorageId,
          completedTasks,
          totalTasks,
          percentage,
          isCurrentUser: u._id === currentUser.userId,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    // 4. Sort: % Tasks Done DESC -> Total Tasks DESC -> Completed Tasks DESC -> Name ASC
    rawEntries.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (b.totalTasks !== a.totalTasks) return b.totalTasks - a.totalTasks;
      if (b.completedTasks !== a.completedTasks)
        return b.completedTasks - a.completedTasks;
      return a.name.localeCompare(b.name);
    });

    // 5. Assign Ranks (Same % AND same totalTasks = Tied Rank)
    const rankedEntries: LeaderboardEntry[] = [];
    for (let i = 0; i < rawEntries.length; i++) {
      const curr = rawEntries[i];
      let rank = i + 1;

      if (i > 0) {
        const prev = rawEntries[i - 1];
        const prevAssignedRank = rankedEntries[i - 1].rank;
        if (
          curr.percentage === prev.percentage &&
          curr.totalTasks === prev.totalTasks
        ) {
          rank = prevAssignedRank;
        }
      }

      rankedEntries.push({
        ...curr,
        rank,
      });
    }

    // Return Top 10 Performers
    return rankedEntries.slice(0, 10);
  },
});