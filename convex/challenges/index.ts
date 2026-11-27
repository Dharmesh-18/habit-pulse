// convex/challenges/index.ts
import { mutation, query, internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { authenticate } from "../common/auth";
import {
  MODE_CONFIG,
  rollJackpotCoins,
  distributeChallengeReward,
  addDaysToDateStr,
  diffDaysInclusive,
  generateInviteCode,
  type ChallengeMode,
} from "./rewards";
import { internal } from "../_generated/api";
import { assertRateLimit } from "../common/rateLimiter";

const ALLOWED_DURATIONS = [7, 14, 21, 30];
const DAILY_CHECKIN_COINS = 5;
const DAILY_CHECKIN_XP = 10;
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const NUDGE_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

async function resolveSessionUserId(ctx: any, sessionToken?: string) {
  if (!sessionToken) return null;
  const session = await ctx.db
    .query("userSessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return session.userId;
}

/**
 * List all challenges the current user participates in, enriched with
 * member profiles, today's check-in flags, and streak progress.
 */
export const listMyChallenges = query({
  args: {
    sessionToken: v.string(),
    todayDate: v.string(), // Client local "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const userId = await resolveSessionUserId(ctx, args.sessionToken);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    const yesterdayDate = addDaysToDateStr(args.todayDate, -1);

    const enriched = await Promise.all(
      memberships.map(async (m) => {
        const challenge = await ctx.db.get(m.challengeId);
        if (!challenge) return null;

        let effectiveStatus = challenge.status;
        if (effectiveStatus === "pending" && challenge.expiresAt < now) {
          effectiveStatus = "expired";
        }

        let nudgeCooldownEndsAt: number | null = null;
        if (effectiveStatus === "active" && challenge.mode !== "solo") {
          const rl = await ctx.db
            .query("rateLimits")
            .withIndex("by_key", (q) =>
              q.eq("key", `nudge:${challenge._id}:${userId}`),
            )
            .first();

          if (rl && rl.timestamps.length > 0) {
            const latestTs = Math.max(...rl.timestamps);
            const expiresAt = latestTs + NUDGE_COOLDOWN_MS;
            if (expiresAt > now) {
              nudgeCooldownEndsAt = expiresAt;
            }
          }
        }

        const participants = await ctx.db
          .query("challengeParticipants")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        const allLogs = await ctx.db
          .query("challengeLogs")
          .withIndex("by_challenge_date", (q) => q.eq("challengeId", challenge._id))
          .collect();

        const todayLogs = allLogs.filter((l) => l.date === args.todayDate);
        const yesterdayLogs = allLogs.filter((l) => l.date === yesterdayDate);

        // Compute completed dates for current user & for entire squad
        const logsCountByDate: Record<string, number> = {};
        const myCompletedDates: string[] = [];

        for (const log of allLogs) {
          logsCountByDate[log.date] = (logsCountByDate[log.date] ?? 0) + 1;
          if (log.userId === userId) {
            myCompletedDates.push(log.date);
          }
        }

        const allCompletedDates = Object.entries(logsCountByDate)
          .filter(
            ([, count]) => participants.length > 0 && count >= participants.length
          )
          .map(([date]) => date);

        // Lazy strict-failure check if yesterday was within [startDate, endDate]
        if (
          effectiveStatus === "active" &&
          challenge.startDate &&
          challenge.endDate &&
          yesterdayDate >= challenge.startDate &&
          yesterdayDate <= challenge.endDate &&
          yesterdayLogs.length < participants.length
        ) {
          effectiveStatus = "failed";
        }

        const memberDetails = await Promise.all(
          participants.map(async (p) => {
            const u = await ctx.db.get(p.userId);
            const checkedInToday = todayLogs.some((l) => l.userId === p.userId);
            return {
              userId: p.userId,
              name: u?.name ?? "Challenger",
              avatarStorageId: u?.avatarStorageId,
              presetAvatarId: u?.presetAvatarId,
              externalAvatarUrl: u?.externalAvatarUrl,
              role: p.role,
              checkedInToday,
            };
          })
        );

        const dayNumber =
          challenge.startDate && args.todayDate >= challenge.startDate
            ? Math.min(
                challenge.durationDays,
                diffDaysInclusive(challenge.startDate, args.todayDate)
              )
            : 0;

        return {
          ...challenge,
          effectiveStatus,
          myRole: m.role,
          dayNumber,
          members: memberDetails,
          myCompletedDates,
          allCompletedDates,
          nudgeCooldownEndsAt,
          myCheckedInToday: todayLogs.some((l) => l.userId === userId),
          allCheckedInToday:
            participants.length > 0 && todayLogs.length >= participants.length,
        };
      })
    );

    const valid = enriched.filter((c): c is NonNullable<typeof c> => c !== null);

    const rank: Record<string, number> = {
      active: 0,
      pending: 1,
      completed: 2,
      failed: 3,
      expired: 4,
    };

    return valid.sort((a, b) => {
      const rDiff = (rank[a.effectiveStatus] ?? 9) - (rank[b.effectiveStatus] ?? 9);
      if (rDiff !== 0) return rDiff;
      return b.createdAt - a.createdAt;
    });
  },
});

/**
 * Public/Authenticated preview of an invite link before joining.
 */
export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const cleanCode = args.inviteCode.trim().toUpperCase();
    const challenge = await ctx.db
      .query("challenges")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", cleanCode))
      .first();

    if (!challenge) return null;

    const participants = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
      .collect();

    const members = await Promise.all(
      participants.map(async (p) => {
        const u = await ctx.db.get(p.userId);
        return {
          userId: p.userId,
          name: u?.name ?? "Challenger",
          avatarStorageId: u?.avatarStorageId,
          presetAvatarId: u?.presetAvatarId,
          externalAvatarUrl: u?.externalAvatarUrl,
          role: p.role,
        };
      })
    );

    const isExpired =
      challenge.status === "expired" ||
      (challenge.status === "pending" && challenge.expiresAt < Date.now());

    return {
      _id: challenge._id,
      title: challenge.title,
      category: challenge.category,
      mode: challenge.mode,
      maxParticipants: challenge.maxParticipants,
      durationDays: challenge.durationDays,
      status: isExpired ? "expired" : challenge.status,
      expiresAt: challenge.expiresAt,
      members,
    };
  },
});

/**
 * Create a Solo, Duo, or Clan challenge.
 * Solo starts immediately; Duo/Clan wait in "pending" for invitees (24h TTL).
 */
export const createChallenge = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    category: v.string(),
    mode: v.union(v.literal("solo"), v.literal("duo"), v.literal("clan")),
    durationDays: v.number(),
    todayDate: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);
    const trimmedTitle = args.title.trim();

    if (trimmedTitle.length < 2 || trimmedTitle.length > 60) {
      throw new ConvexError("Challenge title must be between 2 and 60 characters.");
    }
    if (!ALLOWED_DURATIONS.includes(args.durationDays)) {
      throw new ConvexError("Select a valid duration: 7, 14, 21, or 30 days.");
    }

    const modeCfg = MODE_CONFIG[args.mode as ChallengeMode];
    const now = Date.now();

    // Generate collision-free 6-char invite code
    let inviteCode = generateInviteCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const dup = await ctx.db
        .query("challenges")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
        .first();
      if (!dup) break;
      inviteCode = generateInviteCode();
    }

    const isSolo = args.mode === "solo";
    const startDate = isSolo ? args.todayDate : undefined;
    const endDate = isSolo
      ? addDaysToDateStr(args.todayDate, args.durationDays - 1)
      : undefined;

    const challengeId = await ctx.db.insert("challenges", {
      creatorId: user.userId,
      mode: args.mode,
      maxParticipants: modeCfg.maxParticipants,
      inviteCode,
      title: trimmedTitle,
      category: args.category.trim() || "General",
      durationDays: args.durationDays,
      status: isSolo ? "active" : "pending",
      startDate,
      endDate,
      expiresAt: now + INVITE_TTL_MS,
      rewardType: "coins",
      createdAt: now,
    });

    await ctx.db.insert("challengeParticipants", {
      challengeId,
      userId: user.userId,
      role: "creator",
      joinedAt: now,
      rewardClaimed: false,
    });

    return {
      challengeId,
      inviteCode,
      mode: args.mode,
      status: isSolo ? "active" : "pending",
    };
  },
});

/**
 * Join a pending Duo or Clan challenge via invite code.
 * Duo activates immediately on 2nd member; Clan activates when 2nd member joins
 * (and allows up to 5 total members before startDate ends).
 */
export const joinChallengeByCode = mutation({
  args: {
    sessionToken: v.string(),
    inviteCode: v.string(),
    todayDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);
    const cleanCode = args.inviteCode.trim().toUpperCase();

    const challenge = await ctx.db
      .query("challenges")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", cleanCode))
      .first();

    if (!challenge) {
      throw new ConvexError("Invalid invite link or challenge code.");
    }

    const now = Date.now();
    if (challenge.status === "pending" && challenge.expiresAt < now) {
      await ctx.db.patch(challenge._id, { status: "expired" });
      throw new ConvexError("This invite link has expired (24h limit).");
    }

    if (challenge.status === "expired" || challenge.status === "failed" || challenge.status === "completed") {
      throw new ConvexError(`This challenge is already ${challenge.status}.`);
    }

    const existingMember = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", challenge._id).eq("userId", user.userId)
      )
      .first();

    if (existingMember) {
      throw new ConvexError("You are already part of this challenge!");
    }

    const participants = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
      .collect();

    if (participants.length >= challenge.maxParticipants) {
      throw new ConvexError("This challenge squad is already full!");
    }

    // For Clan, only allow late joins on Day 1 (startDate === todayDate)
    if (
      challenge.status === "active" &&
      challenge.startDate &&
      challenge.startDate !== args.todayDate
    ) {
      throw new ConvexError("This squad challenge has already started!");
    }

    await ctx.db.insert("challengeParticipants", {
      challengeId: challenge._id,
      userId: user.userId,
      role: "member",
      joinedAt: now,
      rewardClaimed: false,
    });

    // Activate challenge when 2nd participant joins
    if (challenge.status === "pending") {
      const startDate = args.todayDate;
      const endDate = addDaysToDateStr(startDate, challenge.durationDays - 1);
      await ctx.db.patch(challenge._id, {
        status: "active",
        startDate,
        endDate,
      });
    }

    return {
      challengeId: challenge._id,
      title: challenge.title,
    };
  },
});

/**
 * Daily Check-In for an Active Challenge:
 * - Strictly Today only (no Streak Freeze Shield)
 * - Verifies yesterday wasn't missed by any member
 * - Credits +5 Coins & +10 XP immediately
 * - If final day & all members checked in -> rolls Jackpot & credits everyone!
 */
export const checkInChallenge = mutation({
  args: {
    sessionToken: v.string(),
    challengeId: v.id("challenges"),
    todayDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      throw new ConvexError("Challenge not found.");
    }
    if (challenge.status !== "active" || !challenge.startDate || !challenge.endDate) {
      throw new ConvexError("This challenge is not active.");
    }

    const membership = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", challenge._id).eq("userId", user.userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a participant in this challenge.");
    }

    const participants = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
      .collect();

    // 1. Strict Streak Audit: Verify yesterday was completed by ALL participants
    const yesterdayDate = addDaysToDateStr(args.todayDate, -1);
    if (yesterdayDate >= challenge.startDate && yesterdayDate <= challenge.endDate) {
      const yesterdayLogs = await ctx.db
        .query("challengeLogs")
        .withIndex("by_challenge_date", (q) =>
          q.eq("challengeId", challenge._id).eq("date", yesterdayDate)
        )
        .collect();

      if (yesterdayLogs.length < participants.length) {
        await ctx.db.patch(challenge._id, {
          status: "failed",
          failedReason: `Missed check-in on ${yesterdayDate}`,
        });
        throw new ConvexError(
          "Challenge streak broken! Yesterday was missed by at least one member."
        );
      }
    }

    // 2. Prevent duplicate check-in today
    const existingLog = await ctx.db
      .query("challengeLogs")
      .withIndex("by_challenge_user_date", (q) =>
        q
          .eq("challengeId", challenge._id)
          .eq("userId", user.userId)
          .eq("date", args.todayDate)
      )
      .first();

    if (existingLog) {
      throw new ConvexError("You have already checked in today!");
    }

    const now = Date.now();
    await ctx.db.insert("challengeLogs", {
      challengeId: challenge._id,
      userId: user.userId,
      date: args.todayDate,
      completedAt: now,
    });

    // 3. Award standard +5 Coins & +10 XP for daily check-in
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .first();

    if (wallet) {
      await ctx.db.patch(wallet._id, {
        coins: wallet.coins + DAILY_CHECKIN_COINS,
        xp: wallet.xp + DAILY_CHECKIN_XP,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userWallets", {
        userId: user.userId,
        coins: DAILY_CHECKIN_COINS,
        xp: DAILY_CHECKIN_XP,
        shields: 0,
        boughtItems: [],
        updatedAt: now,
      });
    }

    await ctx.db.insert("coinTransactions", {
      userId: user.userId,
      type: "habit_reward",
      coinsDelta: DAILY_CHECKIN_COINS,
      referenceId: `${challenge._id}-${args.todayDate}`,
      description: `Challenge Check-in: "${challenge.title}" (+${DAILY_CHECKIN_COINS} Coins)`,
      createdAt: now,
    });

    // 4. Check if Final Day AND All Participants have now completed Today
    const todayLogs = await ctx.db
      .query("challengeLogs")
      .withIndex("by_challenge_date", (q) =>
        q.eq("challengeId", challenge._id).eq("date", args.todayDate)
      )
      .collect();

    const isFinalDay = args.todayDate >= challenge.endDate;
    const allCompletedToday = todayLogs.length >= participants.length;

    let jackpotAwarded = 0;

    if (isFinalDay && allCompletedToday) {
      jackpotAwarded = rollJackpotCoins(
        challenge.durationDays,
        challenge.mode as ChallengeMode
      );

      await ctx.db.patch(challenge._id, {
        status: "completed",
        rewardValue: jackpotAwarded,
      });

      for (const p of participants) {
        if (!p.rewardClaimed) {
          await distributeChallengeReward(ctx, {
            userId: p.userId,
            challengeId: challenge._id,
            challengeTitle: challenge.title,
            rewardType: challenge.rewardType,
            rewardValue: jackpotAwarded,
          });
          await ctx.db.patch(p._id, { rewardClaimed: true });
        }
      }
    }

    return {
      success: true,
      dailyCoins: DAILY_CHECKIN_COINS,
      dailyXp: DAILY_CHECKIN_XP,
      challengeCompleted: isFinalDay && allCompletedToday,
      jackpotAwarded,
    };
  },
});

/**
 * Dismiss or Cancel a pending/finished challenge from the user's dashboard view.
 */
export const leaveOrCancelChallenge = mutation({
  args: {
    sessionToken: v.string(),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return { removed: true };

    const membership = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", challenge._id).eq("userId", user.userId)
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);
    }

    // Check remaining participants after this user leaves
    const remaining = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
      .collect();

    if (challenge.status === "pending" && challenge.creatorId === user.userId) {
      await ctx.db.patch(challenge._id, { status: "expired" });
    } else if (challenge.status === "active") {
      // Solo has 0 remaining; Duo has 1 remaining (cannot continue solo)
      if (remaining.length === 0 || (challenge.mode === "duo" && remaining.length < 2)) {
        await ctx.db.patch(challenge._id, {
          status: "failed",
          failedReason: `${user.name} quit the challenge`,
        });
      }
    }

    return { removed: true };
  },
});

/**
 * Hourly/Daily Cron Cleanup:
 * 1) Expires unaccepted pending invites older than 24 hours.
 * 2) Fails active challenges where a past day was missed by any participant.
 */
export const internalAuditChallenges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Clean expired pending invites (> 24h old)
    const pendingChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    let expiredCount = 0;
    for (const c of pendingChallenges) {
      if (c.expiresAt < now) {
        await ctx.db.patch(c._id, { status: "expired" });
        expiredCount++;
      }
    }

    // 2. Audit active challenges (2-day buffer handles global timezones safely)
    const twoDaysAgoUtc = new Date(now - 2 * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const activeChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let failedCount = 0;
    for (const c of activeChallenges) {
      if (!c.startDate || !c.endDate) continue;
      if (twoDaysAgoUtc >= c.startDate && twoDaysAgoUtc <= c.endDate) {
        const participants = await ctx.db
          .query("challengeParticipants")
          .withIndex("by_challenge", (q) => q.eq("challengeId", c._id))
          .collect();

        const logs = await ctx.db
          .query("challengeLogs")
          .withIndex("by_challenge_date", (q) =>
            q.eq("challengeId", c._id).eq("date", twoDaysAgoUtc)
          )
          .collect();

        if (logs.length < participants.length) {
          await ctx.db.patch(c._id, {
            status: "failed",
            failedReason: `Missed check-in on ${twoDaysAgoUtc}`,
          });
          failedCount++;
        }
      }
    }

    return { expiredCount, failedCount };
  },
});

/**
 * Nudge pending teammates in an active Duo or Clan challenge.
 * Rate-limited to max 1 nudge burst per 15 minutes per sender per challenge.
 */
export const nudgeChallengeMembers = mutation({
  args: {
    sessionToken: v.string(),
    challengeId: v.id("challenges"),
    todayDate: v.string(),
  },
  handler: async (ctx, args) => {
    const sender = await authenticate(ctx, args.sessionToken);
    const challenge = await ctx.db.get(args.challengeId);

    if (!challenge) {
      throw new ConvexError("Challenge not found.");
    }
    if (challenge.mode === "solo") {
      throw new ConvexError("Solo challenges have no teammates to nudge.");
    }
    if (challenge.status !== "active" || !challenge.startDate) {
      throw new ConvexError("You can only nudge members in an active challenge.");
    }

    const participants = await ctx.db
      .query("challengeParticipants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
      .collect();

    const isMember = participants.some((p) => p.userId === sender.userId);
    if (!isMember) {
      throw new ConvexError("You are not a participant in this challenge.");
    }

    // Find teammates who have NOT checked in today
    const todayLogs = await ctx.db
      .query("challengeLogs")
      .withIndex("by_challenge_date", (q) =>
        q.eq("challengeId", challenge._id).eq("date", args.todayDate),
      )
      .collect();

    const completedUserIds = new Set(todayLogs.map((l) => l.userId));
    const pendingParticipants = participants.filter(
      (p) => p.userId !== sender.userId && !completedUserIds.has(p.userId),
    );

    if (pendingParticipants.length === 0) {
      throw new ConvexError("All teammates have already checked in today!");
    }

    // Enforce 1 nudge per 15 minutes per sender per challenge
    await assertRateLimit(ctx, {
      key: `nudge:${challenge._id}:${sender.userId}`,
      maxRequests: 1,
      windowMs: NUDGE_COOLDOWN_MS,
    });

    const recipients: Array<{
      userId: typeof sender.userId;
      email: string;
      name: string;
    }> = [];

    for (const p of pendingParticipants) {
      const targetUser = await ctx.db.get(p.userId);
      if (targetUser?.email) {
        recipients.push({
          userId: targetUser._id,
          email: targetUser.email,
          name: targetUser.name ?? "Challenger",
        });
      }
    }

    const dayNumber = Math.min(
      challenge.durationDays,
      diffDaysInclusive(challenge.startDate, args.todayDate),
    );

    if (recipients.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.challenges.nudges.sendChallengeNudge,
        {
          senderName: sender.name ?? "Your teammate",
          challengeId: challenge._id,
          challengeTitle: challenge.title,
          category: challenge.category,
          mode: challenge.mode,
          dayNumber,
          durationDays: challenge.durationDays,
          recipients,
        },
      );
    }

    return {
      nudgedCount: recipients.length,
      cooldownEndsAt: Date.now() + NUDGE_COOLDOWN_MS,
    };
  },
});