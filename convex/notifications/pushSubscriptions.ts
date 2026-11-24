// convex/notifications/pushSubscriptions.ts
import { mutation, query, internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { authenticate } from "../common/auth";

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

export const resolveUserFromToken = internalQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;
    return { userId: session.userId };
  },
});

export const getUserSubscriptions = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const deleteStaleSubscription = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.subscriptionId);
    if (doc) {
      await ctx.db.delete(args.subscriptionId);
    }
  },
});