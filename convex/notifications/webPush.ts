// convex/notifications/webPush.ts
"use node";

import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { setVapidDetails, sendNotification } from "web-push";

function configureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

  if (!publicKey || !privateKey) {
    throw new ConvexError(
      "VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is missing in Convex environment variables."
    );
  }

  const rawSubject =
    process.env.VAPID_SUBJECT?.trim() ?? "mailto:dharmeshtiwari1280@gmail.com";
  const subject =
    rawSubject.startsWith("mailto:") || rawSubject.startsWith("https://")
      ? rawSubject
      : `mailto:${rawSubject}`;

  setVapidDetails(subject, publicKey, privateKey);
}

export const sendPushToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ delivered: number; staleRemoved: number }> => {
    configureVapid();

    const subscriptions = await ctx.runQuery(
      internal.notifications.pushSubscriptions.getUserSubscriptions,
      { userId: args.userId }
    );

    if (subscriptions.length === 0) {
      console.log(`[WebPush] No registered push devices for user ${args.userId}.`);
      return { delivered: 0, staleRemoved: 0 };
    }

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url ?? "/",
      tag: args.tag ?? "habit-reminder",
    });

    let delivered = 0;
    let staleRemoved = 0;

    await Promise.all(
      subscriptions.map(async (sub: Doc<"pushSubscriptions">) => {
        try {
          await sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload,
            {
              TTL: 60 * 60, // 1 hour retry window
              urgency: "high", // Wake Android Doze mode immediately
            }
          );
          delivered += 1;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            staleRemoved += 1;
            console.log(`[WebPush] Removing stale subscription ${sub._id} (${statusCode})`);
            await ctx.runMutation(
              internal.notifications.pushSubscriptions.deleteStaleSubscription,
              { subscriptionId: sub._id }
            );
          } else {
            console.error(
              `[WebPush] Delivery failed for ${sub._id} (status ${statusCode ?? "unknown"}):`,
              err
            );
          }
        }
      })
    );

    console.log(
      `[WebPush] Completed for user ${args.userId}: delivered=${delivered}, staleRemoved=${staleRemoved}`
    );
    return { delivered, staleRemoved };
  },
});

export const sendTestPush = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, args): Promise<{ delivered: number }> => {
    const user = await ctx.runQuery(
      internal.notifications.pushSubscriptions.resolveUserFromToken,
      { sessionToken: args.sessionToken }
    );
    if (!user) {
      throw new ConvexError("Session expired. Please sign in again.");
    }

    const result = await ctx.runAction(
      internal.notifications.webPush.sendPushToUser,
      {
        userId: user.userId,
        title: "🔥 Habit Pulse Test Notification",
        body: "Device push is active! Your scheduled habit reminders will arrive right here.",
        url: "/profile",
        tag: `habit-pulse-test-${Date.now()}`,
      }
    );

    if (result.delivered === 0) {
      throw new ConvexError(
        "No active push subscription delivered. Toggle Device Push OFF and ON again on this device."
      );
    }

    return { delivered: result.delivered };
  },
});