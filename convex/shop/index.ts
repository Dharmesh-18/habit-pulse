// convex/shop/index.ts
import { mutation, query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { authenticate } from "../common/auth";

export const INITIAL_SHOP_AVATARS = [
  { itemKey: "avatar-coco", title: "Coco", itemType: "avatar", price: 15, assetPath: "/avatars/coco.svg", sortOrder: 1 },
  { itemKey: "avatar-poki", title: "Poki", itemType: "avatar", price: 30, assetPath: "/avatars/poki.svg", sortOrder: 2 },
  { itemKey: "avatar-panda", title: "Panda", itemType: "avatar", price: 50, assetPath: "/avatars/panda.svg", sortOrder: 3 },
  { itemKey: "avatar-sorci", title: "Sorci", itemType: "avatar", price: 80, assetPath: "/avatars/sorci.svg", sortOrder: 4 },
  { itemKey: "avatar-knight", title: "Knight", itemType: "avatar", price: 120, assetPath: "/avatars/knight.svg", sortOrder: 5 },
  { itemKey: "avatar-ninja", title: "Ninja", itemType: "avatar", price: 175, assetPath: "/avatars/ninja.svg", sortOrder: 6 },
  { itemKey: "avatar-warrior", title: "Warrior", itemType: "avatar", price: 250, assetPath: "/avatars/warrior.svg", sortOrder: 7 },
  { itemKey: "avatar-angel", title: "Angel", itemType: "avatar", price: 350, assetPath: "/avatars/angel.svg", sortOrder: 8 },
  { itemKey: "avatar-pirate", title: "Pirate", itemType: "avatar", price: 500, assetPath: "/avatars/pirate.svg", sortOrder: 9 },
  { itemKey: "avatar-king", title: "King", itemType: "avatar", price: 750, assetPath: "/avatars/king.svg", sortOrder: 10 },
];

// Helper function to resolve session token to userId:
async function resolveSessionUserId(ctx: any, sessionToken?: string) {
  if (!sessionToken) return null;
  const session = await ctx.db
    .query("userSessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return session.userId;
}

// 1. Reactive Wallet Query (Never crashes UI on empty/stale token)
export const getMyWallet = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await resolveSessionUserId(ctx, args.sessionToken);
    if (!userId) {
      return { coins: 0, xp: 0, boughtItems: [] as string[] };
    }

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      coins: wallet?.coins ?? 0,
      xp: wallet?.xp ?? 0,
      boughtItems: wallet?.boughtItems ?? [],
    };
  },
});

// 2. Get Active Shop Items
export const listShopItems = query({
  args: {
    sessionToken: v.optional(v.string()),
    itemType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await resolveSessionUserId(ctx, args.sessionToken);
    if (!userId) return [];

    const items = args.itemType
      ? await ctx.db
          .query("shopItems")
          .withIndex("by_type_active", (q) =>
            q.eq("itemType", args.itemType!).eq("isActive", true)
          )
          .collect()
      : await ctx.db
          .query("shopItems")
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// 3. Idempotent Seeder (Safe to call on Shop mount if DB is empty)
export const ensureShopSeeded = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await authenticate(ctx, args.sessionToken);

    for (const item of INITIAL_SHOP_AVATARS) {
      const existing = await ctx.db
        .query("shopItems")
        .withIndex("by_item_key", (q) => q.eq("itemKey", item.itemKey))
        .first();

      if (!existing) {
        await ctx.db.insert("shopItems", {
          ...item,
          isActive: true,
        });
      }
    }
    return { seeded: true };
  },
});

// 4. Atomic Purchase Mutation
export const buyItem = mutation({
  args: {
    sessionToken: v.string(),
    itemKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticate(ctx, args.sessionToken);

    const item = await ctx.db
      .query("shopItems")
      .withIndex("by_item_key", (q) => q.eq("itemKey", args.itemKey))
      .first();

    if (!item || !item.isActive) {
      throw new ConvexError("This shop item is no longer available.");
    }

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .first();

    const currentCoins = wallet?.coins ?? 0;
    const boughtItems = wallet?.boughtItems ?? [];

    if (boughtItems.includes(item.itemKey)) {
      throw new ConvexError(`You already own "${item.title}"!`);
    }

    if (currentCoins < item.price) {
      throw new ConvexError(
        `Not enough coins! You need ${item.price - currentCoins} more coins.`
      );
    }

    const updatedCoins = currentCoins - item.price;
    const updatedBought = [...boughtItems, item.itemKey];

    if (wallet) {
      await ctx.db.patch(wallet._id, {
        coins: updatedCoins,
        boughtItems: updatedBought,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userWallets", {
        userId: user.userId,
        coins: updatedCoins,
        xp: 0,
        boughtItems: updatedBought,
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      remainingCoins: updatedCoins,
      itemKey: item.itemKey,
      title: item.title,
    };
  },
});