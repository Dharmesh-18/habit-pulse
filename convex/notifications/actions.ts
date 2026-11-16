// convex/notifications/actions.ts
"use node";

import { internalAction, type ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { EmailNotificationProvider } from "./providers/emailProvider";
import {
  type ChannelProvider,
  type NotificationChannel,
  type NotificationPayload,
} from "./types";

// Registry of active channel providers (Add WhatsAppProvider here in the future)
const providers: Record<string, ChannelProvider> = {
  email: new EmailNotificationProvider(),
};

async function dispatchNotification(
  ctx: ActionCtx,
  params: {
    userId: Id<"users">;
    fallbackEmail: string;
    fallbackName?: string;
    channels: NotificationChannel[];
    payload: NotificationPayload;
  },
) {
  const user = await ctx.runQuery(internal.auth.index.getUserByIdInternal, {
    userId: params.userId,
  });

  const isNotificationsEnabled = user?.notificationPreferences?.enabled ?? true;
  if (!isNotificationsEnabled) {
    console.info(
      `[NotificationDispatcher] Skipped "${params.payload.eventType}" — notifications are OFF for user ${params.userId}.`,
    );
    return;
  }

  const recipient = {
    email: user?.email ?? params.fallbackEmail,
    name: user?.name ?? params.fallbackName,
  };

  for (const ch of params.channels) {
    const provider = providers[ch];
    if (!provider) {
      console.warn(
        `[NotificationDispatcher] Channel "${ch}" is not registered yet.`,
      );
      continue;
    }
    try {
      await provider.send(recipient, params.payload);
    } catch (err) {
      console.error(`[NotificationDispatcher] Failed on channel "${ch}":`, err);
    }
  }
}

/**
 * 1. Triggered asynchronously when a user creates a new habit
 */
export const sendHabitCreatedNotification = internalAction({
  args: {
    userId: v.id("users"),
    email: v.string(),
    userName: v.optional(v.string()),
    habitTitle: v.string(),
    category: v.string(),
    reminderTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await dispatchNotification(ctx, {
      userId: args.userId,
      fallbackEmail: args.email,
      fallbackName: args.userName,
      channels: ["email"],
      payload: {
        eventType: "HABIT_CREATED",
        habitTitle: args.habitTitle,
        category: args.category,
        reminderTime: args.reminderTime,
      },
    });
  },
});

export const sendHabitReminderNotification = internalAction({
  args: {
    userId: v.id("users"),
    email: v.string(),
    userName: v.optional(v.string()),
    habitTitle: v.string(),
    category: v.string(),
    reminderTime: v.string(),
  },
  handler: async (ctx, args) => {
    await dispatchNotification(ctx, {
      userId: args.userId,
      fallbackEmail: args.email,
      fallbackName: args.userName,
      channels: ["email"],
      payload: {
        eventType: "DAILY_REMINDER",
        habitTitle: args.habitTitle,
        category: args.category,
        reminderTime: args.reminderTime,
      },
    });
  },
});
