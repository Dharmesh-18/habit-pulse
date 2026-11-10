// convex/storage/index.ts
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { authenticate } from "../common/auth";

// Step 1: Signed upload URL mangna
export const generateUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await authenticate(ctx, args.sessionToken);
    return await ctx.storage.generateUploadUrl();
  },
});

// Step 2: Storage ID se live CDN image URL fetch karna (reactive)
export const getImageUrl = query({
  args: { storageId: v.optional(v.id("_storage")) },
  handler: async (ctx, args) => {
    if (!args.storageId) return null;
    return await ctx.storage.getUrl(args.storageId);
  },
});

// User profile avatar save karna
export const saveUserAvatar = mutation({
  args: {
    sessionToken: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);
    await ctx.db.patch(user.userId, { avatarStorageId: args.storageId });
    return { success: true };
  },
});