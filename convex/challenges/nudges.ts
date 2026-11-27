// convex/challenges/nudges.ts
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const sendChallengeNudge = internalAction({
  args: {
    senderName: v.string(),
    challengeId: v.id("challenges"),
    challengeTitle: v.string(),
    category: v.string(),
    mode: v.union(v.literal("duo"), v.literal("clan")),
    dayNumber: v.number(),
    durationDays: v.number(),
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        email: v.string(),
        name: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const modeLabel = args.mode === "duo" ? "Duo Buddy" : "Clan Squad";

    for (const recipient of args.recipients) {
      const results = await Promise.allSettled([
        ctx.runAction(
          internal.notifications.actions.sendHabitReminderNotification,
          {
            userId: recipient.userId,
            email: recipient.email,
            userName: recipient.name,
            habitTitle: `${args.challengeTitle} (${modeLabel} Nudge from ${args.senderName})`,
            category: args.category,
            reminderTime: `Day ${args.dayNumber}/${args.durationDays}`,
          },
        ),
        ctx.runAction(internal.notifications.webPush.sendPushToUser, {
          userId: recipient.userId,
          title: `🔔 ${args.senderName} nudged you!`,
          body: `Don't break the "${args.challengeTitle}" streak (Day ${args.dayNumber}/${args.durationDays})! Tap to check in.`,
          url: "/challenges",
          tag: `challenge-nudge-${args.challengeId}`,
        }),
      ]);

      results.forEach((res, idx) => {
        if (res.status === "rejected") {
          console.error(
            `[ChallengeNudge] ${idx === 0 ? "Email" : "WebPush"} failed for user ${recipient.userId}:`,
            res.reason,
          );
        }
      });
    }
  },
});