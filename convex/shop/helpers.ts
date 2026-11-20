// convex/shop/helpers.ts
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const HABIT_COMPLETION_COINS = 5;
export const HABIT_COMPLETION_XP = 5;

export const MILESTONE_COIN_REWARDS: Record<number, number> = {
  1: 10,
  3: 20,
  7: 40,
  14: 75,
  21: 110,
  30: 175,
  50: 300,
  100: 600,
  200: 1000,
  365: 2000,
  500: 3000,
  1000: 6000,
};

export function computeMilestoneBonusCoins(milestones: number[]): number {
  return milestones.reduce(
    (sum, m) => sum + (MILESTONE_COIN_REWARDS[m] ?? 0),
    0
  );
}

export async function creditWalletActivity(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    coinsToAdd: number;
    xpToAdd: number;
  }
) {
  const existing = await ctx.db
    .query("userWallets")
    .withIndex("by_user", (q) => q.eq("userId", params.userId))
    .first();

  const now = Date.now();
  if (existing) {
    const nextCoins = existing.coins + params.coinsToAdd;
    const nextXp = existing.xp + params.xpToAdd;
    await ctx.db.patch(existing._id, {
      coins: nextCoins,
      xp: nextXp,
      updatedAt: now,
    });
    return { coins: nextCoins, xp: nextXp };
  }

  await ctx.db.insert("userWallets", {
    userId: params.userId,
    coins: params.coinsToAdd,
    xp: params.xpToAdd,
    boughtItems: [],
    updatedAt: now,
  });

  return { coins: params.coinsToAdd, xp: params.xpToAdd };
}