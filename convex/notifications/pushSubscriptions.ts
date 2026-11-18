// convex/notifications/pushSubscriptions.ts
import { mutation, query, internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { authenticate } from "../common/auth";

// 1. Save or update browser push subscription for current user
export const subscribe = mutation({
  args: {
    sessionToken: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);
    const now = Date.now();

    // Check if this browser endpoint already exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: user.userId,
        p256dh: args.p256dh,
        auth: args.auth,
        userAgent: args.userAgent,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: user.userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      userAgent: args.userAgent,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// 2. Remove subscription when user turns off push on this device
export const unsubscribe = mutation({
  args: {
    sessionToken: v.string(),
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing && existing.userId === user.userId) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

// 3. Check if current device endpoint is registered in DB
export const isEndpointSubscribed = query({
  args: {
    sessionToken: v.string(),
    endpoint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.endpoint) return false;
    const user = await authenticate(ctx, args.sessionToken);

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint!))
      .first();

    return Boolean(existing && existing.userId === user.userId);
  },
});

// 4. Internal: Fetch all active device subscriptions for a user
export const getUserSubscriptions = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// 5. Internal: Delete dead/expired subscription (HTTP 404 / 410 Gone)
export const deleteStaleSubscription = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.subscriptionId);
    if (doc) {
      await ctx.db.delete(args.subscriptionId);
    }
  },
});