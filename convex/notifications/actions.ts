// convex/notifications/actions.ts
"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { EmailNotificationProvider } from "./providers/emailProvider";
import { type ChannelProvider, type NotificationChannel, type NotificationPayload, type RecipientInfo } from "./types";

// Registry of active channel providers (Add WhatsAppProvider here in the future)
const providers: Record<string, ChannelProvider> = {
  email: new EmailNotificationProvider(),
};

async function dispatchNotification(
  recipient: RecipientInfo,
  channels: NotificationChannel[],
  payload: NotificationPayload
) {
  for (const ch of channels) {
    const provider = providers[ch];
    if (!provider) {
      console.warn(`[NotificationDispatcher] Channel "${ch}" is not registered yet.`);
      continue;
    }
    try {
      await provider.send(recipient, payload);
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
    email: v.string(),
    userName: v.optional(v.string()),
    habitTitle: v.string(),
    category: v.string(),
    reminderTime: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    await dispatchNotification(
      { email: args.email, name: args.userName },
      ["email"], // Future: ["email", "whatsapp"]
      {
        eventType: "HABIT_CREATED",
        habitTitle: args.habitTitle,
        category: args.category,
        reminderTime: args.reminderTime,
      }
    );
  },
});

/**
 * 2. Triggered by the scheduled reminder job
 */
export const sendHabitReminderNotification = internalAction({
  args: {
    email: v.string(),
    userName: v.optional(v.string()),
    habitTitle: v.string(),
    category: v.string(),
    reminderTime: v.string(),
  },
  handler: async (_ctx, args) => {
    await dispatchNotification(
      { email: args.email, name: args.userName },
      ["email"],
      {
        eventType: "DAILY_REMINDER",
        habitTitle: args.habitTitle,
        category: args.category,
        reminderTime: args.reminderTime,
      }
    );
  },
});