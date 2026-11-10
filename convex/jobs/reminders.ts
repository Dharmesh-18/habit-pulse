// convex/jobs/reminders.ts
import { internalAction } from "../_generated/server";
import { v } from "convex/values";

// 1. Non-deterministic action (simulates external webhook / push notification)
export const processReminderAction = internalAction({
  args: {
    habitId: v.id("habits"),
    userEmail: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[EXTERNAL_ACTION] Sending Push Notification to: ${args.userEmail}`);
    console.log(`[NOTIFICATION_PAYLOAD] Time to complete your habit: "${args.title}"`);

    // In production: await fetch("https://api.resend.com/emails", { ... })
  },
});