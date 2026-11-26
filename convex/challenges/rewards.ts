// convex/challenges/rewards.ts
import type { Id } from "../_generated/dataModel";

export type ChallengeMode = "solo" | "duo" | "clan";

export const MODE_CONFIG: Record<
  ChallengeMode,
  { label: string; maxParticipants: number; multiplier: number }
> = {
  solo: { label: "Solo Focus", maxParticipants: 1, multiplier: 1.0 },
  duo: { label: "Duo Buddy", maxParticipants: 2, multiplier: 1.5 },
  clan: { label: "Squad Clan", maxParticipants: 5, multiplier: 2.0 },
};

const BASE_JACKPOT_RANGES: Record<number, { min: number; max: number }> = {
  7: { min: 40, max: 70 },
  14: { min: 90, max: 150 },
  21: { min: 160, max: 250 },
  30: { min: 250, max: 400 },
};

export function getJackpotRange(durationDays: number, mode: ChallengeMode) {
  const base = BASE_JACKPOT_RANGES[durationDays] ?? { min: 40, max: 70 };
  const mult = MODE_CONFIG[mode].multiplier;
  return {
    min: Math.round(base.min * mult),
    max: Math.round(base.max * mult),
  };
}

export function rollJackpotCoins(
  durationDays: number,
  mode: ChallengeMode
): number {
  const { min, max } = getJackpotRange(durationDays, mode);
  // Round to nearest 5 coins for clean numbers
  const raw = Math.floor(Math.random() * (max - min + 1)) + min;
  return Math.max(min, Math.round(raw / 5) * 5);
}

/**
 * Pluggable reward distributor:
 * Currently credits in-app coins + audit ledger.
 * Extend switch(rewardType) later for "voucher" or "cash" payouts.
 */
export async function distributeChallengeReward(
  ctx: any,
  params: {
    userId: Id<"users">;
    challengeId: Id<"challenges">;
    challengeTitle: string;
    rewardType: "coins" | "voucher" | "cash";
    rewardValue: number;
  }
) {
  const now = Date.now();

  if (params.rewardType === "coins") {
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q: any) => q.eq("userId", params.userId))
      .first();

    if (wallet) {
      await ctx.db.patch(wallet._id, {
        coins: wallet.coins + params.rewardValue,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userWallets", {
        userId: params.userId,
        coins: params.rewardValue,
        xp: 0,
        shields: 0,
        boughtItems: [],
        updatedAt: now,
      });
    }

    await ctx.db.insert("coinTransactions", {
      userId: params.userId,
      type: "challenge_reward",
      coinsDelta: params.rewardValue,
      referenceId: `${params.challengeId}`,
      description: `Challenge Jackpot: "${params.challengeTitle}" (+${params.rewardValue} Coins)`,
      createdAt: now,
    });
  }
}

export function addDaysToDateStr(dateStr: string, daysToAdd: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + daysToAdd);
  return dt.toISOString().slice(0, 10);
}

export function diffDaysInclusive(startStr: string, currentStr: string): number {
  const [sy, sm, sd] = startStr.split("-").map(Number);
  const [cy, cm, cd] = currentStr.split("-").map(Number);
  const sMs = Date.UTC(sy, sm - 1, sd);
  const cMs = Date.UTC(cy, cm - 1, cd);
  return Math.floor((cMs - sMs) / 86_400_000) + 1;
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes ambiguous O/0/I/1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}