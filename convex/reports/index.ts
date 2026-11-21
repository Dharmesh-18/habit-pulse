// convex/reports/index.ts
import { action, internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { AggregatedHabitStats } from "./aggregator";
import {
  generateCohereCoaching,
  type AiCoachingAnalysis,
} from "./cohereClient";

export const REPORT_PRICES = {
  week: 10,
  month: 25,
} as const;

export interface HabitReportPayload {
  generatedAt: number;
  coinsSpent: number;
  stats: AggregatedHabitStats;
  coaching: AiCoachingAnalysis;
}

interface ChargeResult {
  userId: Id<"users">;
  coinsCharged: number;
  remainingCoins: number;
}

// Atomic Coin Check + Deduction + Ledger Log
export const chargeReportCoins = internalMutation({
  args: {
    sessionToken: v.string(),
    period: v.union(v.literal("week"), v.literal("month")),
  },
  handler: async (ctx, args): Promise<ChargeResult> => {
    if (!args.sessionToken) {
      throw new ConvexError("Session expired. Please sign in again.");
    }

    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError("Session expired. Please sign in again.");
    }

    const cost = REPORT_PRICES[args.period];
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .first();

    const currentCoins = wallet?.coins ?? 0;
    if (!wallet || currentCoins < cost) {
      throw new ConvexError(
        `Not enough coins! You need ${cost} Coins (current balance: ${currentCoins}). Complete habits or top up in the Shop.`
      );
    }

    const now = Date.now();
    const remainingCoins = currentCoins - cost;

    await ctx.db.patch(wallet._id, {
      coins: remainingCoins,
      updatedAt: now,
    });

    await ctx.db.insert("coinTransactions", {
      userId: session.userId,
      type: "shop_spend",
      coinsDelta: -cost,
      referenceId: `pulse-report-${args.period}-${now}`,
      description:
        args.period === "week"
          ? "Generated Weekly Pulse Coach AI Report"
          : "Generated Monthly Pulse Coach AI Report",
      createdAt: now,
    });

    return {
      userId: session.userId,
      coinsCharged: cost,
      remainingCoins,
    };
  },
});

// Safety-net refund if dataset generation fails after coin charge
export const refundReportCoins = internalMutation({
  args: {
    userId: v.id("users"),
    coinsToRefund: v.number(),
    period: v.union(v.literal("week"), v.literal("month")),
  },
  handler: async (ctx, args): Promise<void> => {
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    if (wallet) {
      await ctx.db.patch(wallet._id, {
        coins: wallet.coins + args.coinsToRefund,
        updatedAt: now,
      });
    }

    await ctx.db.insert("coinTransactions", {
      userId: args.userId,
      type: "habit_reward",
      coinsDelta: args.coinsToRefund,
      referenceId: `pulse-report-refund-${args.period}-${now}`,
      description: "Refund: Report generation interrupted",
      createdAt: now,
    });
  },
});

export const generateHabitReport = action({
  args: {
    sessionToken: v.string(),
    period: v.union(v.literal("week"), v.literal("month")),
  },
  handler: async (ctx, args): Promise<HabitReportPayload> => {
    // 1. Validate session & charge coins atomically first
    const charge = await ctx.runMutation(
      internal.reports.index.chargeReportCoins,
      {
        sessionToken: args.sessionToken,
        period: args.period,
      }
    );

    try {
      // 2. Aggregate habit dataset
      const stats = await ctx.runQuery(
        internal.reports.aggregator.getReportDataset,
        {
          sessionToken: args.sessionToken,
          period: args.period,
        }
      );

      if (!stats) {
        throw new ConvexError("Could not load habit records.");
      }

      // 3. Run Pulse Coach AI analysis (with deterministic fallback)
      const coaching = await generateCohereCoaching(stats);

      return {
        generatedAt: Date.now(),
        coinsSpent: charge.coinsCharged,
        stats,
        coaching,
      };
    } catch (err) {
      // Refund coins if anything fails after deduction
      await ctx.runMutation(internal.reports.index.refundReportCoins, {
        userId: charge.userId,
        coinsToRefund: charge.coinsCharged,
        period: args.period,
      });
      throw err;
    }
  },
});