// convex/notifications/webPush.ts
"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import * as webpush from "web-push";

export const sendPushToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      console.warn("[WebPush] VAPID keys missing in Convex env. Skipping push.");
      return;
    }

    const rawSubject =
      process.env.VAPID_SUBJECT ?? "mailto:dharmeshtiwari1280@gmail.com";
    const subject =
      rawSubject.startsWith("mailto:") || rawSubject.startsWith("https://")
        ? rawSubject
        : `mailto:${rawSubject}`;

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subscriptions = await ctx.runQuery(
      internal.notifications.pushSubscriptions.getUserSubscriptions,
      { userId: args.userId }
    );

    if (subscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url ?? "/",
      tag: args.tag ?? "habit-reminder",
    });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          // 404 Not Found or 410 Gone means user revoked permission or uninstalled browser
          if (statusCode === 404 || statusCode === 410) {
            console.log(`[WebPush] Cleaning stale subscription ${sub._id}`);
            await ctx.runMutation(
              internal.notifications.pushSubscriptions.deleteStaleSubscription,
              { subscriptionId: sub._id }
            );
          } else {
            console.error("[WebPush] Failed to send notification:", err);
          }
        }
      })
    );
  },
});