// convex/shop/index.ts
import { mutation, query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { authenticate } from "../common/auth";

export const MAX_STREAK_SHIELDS = 3;

export const INITIAL_SHOP_POWERUPS = [
  {
    itemKey: "powerup-streak-freeze",
    title: "Streak Freeze Shield",
    itemType: "powerup",
    price: 75,
    assetPath: "/avatars/shield.svg",
    sortOrder: 0,
  },
];

export const INITIAL_SHOP_AVATARS = [
  { itemKey: "avatar-coco", title: "Coco", itemType: "avatar", price: 100, assetPath: "/avatars/coco.svg", sortOrder: 1 },
  { itemKey: "avatar-poki", title: "Poki", itemType: "avatar", price: 100, assetPath: "/avatars/poki.svg", sortOrder: 2 },
  { itemKey: "avatar-charma", title: "Charma", itemType: "avatar", price: 200, assetPath: "/avatars/charma.svg", sortOrder: 3 },
  { itemKey: "avatar-panda", title: "Panda", itemType: "avatar", price: 250, assetPath: "/avatars/panda.svg", sortOrder: 4 },
  { itemKey: "avatar-sorci", title: "Sorci", itemType: "avatar", price: 300, assetPath: "/avatars/sorci.svg", sortOrder: 5 },
  { itemKey: "avatar-magician", title: "Magician", itemType: "avatar", price: 500, assetPath: "/avatars/magician.svg", sortOrder: 6 },
  { itemKey: "avatar-oracle", title: "Oracle", itemType: "avatar", price: 500, assetPath: "/avatars/oracle.svg", sortOrder: 7 },
  { itemKey: "avatar-shooter", title: "Shooter", itemType: "avatar", price: 600, assetPath: "/avatars/shooter.svg", sortOrder: 8 },
  { itemKey: "avatar-soldier", title: "Soldier", itemType: "avatar", price: 600, assetPath: "/avatars/soldier.svg", sortOrder: 9 },
  { itemKey: "avatar-knight", title: "Knight", itemType: "avatar", price: 700, assetPath: "/avatars/knight.svg", sortOrder: 10 },
  { itemKey: "avatar-knightess", title: "Knightess", itemType: "avatar", price: 800, assetPath: "/avatars/knightess.svg", sortOrder: 11 },
  { itemKey: "avatar-ninja", title: "Ninja", itemType: "avatar", price: 1000, assetPath: "/avatars/ninja.svg", sortOrder: 12 },
  { itemKey: "avatar-warrior", title: "Warrior", itemType: "avatar", price: 1200, assetPath: "/avatars/warrior.svg", sortOrder: 13 },
  { itemKey: "avatar-samurai", title: "Samurai", itemType: "avatar", price: 1500, assetPath: "/avatars/samurai.svg", sortOrder: 14 },
  { itemKey: "avatar-king", title: "King", itemType: "avatar", price: 2000, assetPath: "/avatars/king.svg", sortOrder: 15 },
  { itemKey: "avatar-angel", title: "Angel", itemType: "avatar", price: 2200, assetPath: "/avatars/angel.svg", sortOrder: 16 },
  { itemKey: "avatar-pirate", title: "Pirate", itemType: "avatar", price: 2500, assetPath: "/avatars/pirate.svg", sortOrder: 17 },
  { itemKey: "avatar-scientist", title: "Scientist", itemType: "avatar", price: 3000, assetPath: "/avatars/scientist.svg", sortOrder: 18 },
  { itemKey: "avatar-hanuman", title: "Hanuman", itemType: "avatar", price: 5000, assetPath: "/avatars/hanuman.svg", sortOrder: 19 },
  { itemKey: "avatar-shiva", title: "Shiva", itemType: "avatar", price: 10000, assetPath: "/avatars/shiva.svg", sortOrder: 20 },
];

const ALL_INITIAL_SHOP_ITEMS = [...INITIAL_SHOP_POWERUPS, ...INITIAL_SHOP_AVATARS];

async function resolveSessionUserId(ctx: any, sessionToken?: string) {
  if (!sessionToken) return null;
  const session = await ctx.db
    .query("userSessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return session.userId;
}

export const getMyWallet = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await resolveSessionUserId(ctx, args.sessionToken);
    if (!userId) {
      return { coins: 0, xp: 0, shields: 0, boughtItems: [] as string[] };
    }

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      coins: wallet?.coins ?? 0,
      xp: wallet?.xp ?? 0,
      shields: wallet?.shields ?? 0,
      boughtItems: wallet?.boughtItems ?? [],
    };
  },
});

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

export const ensureShopSeeded = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await authenticate(ctx, args.sessionToken);

    for (const item of ALL_INITIAL_SHOP_ITEMS) {
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
    const currentShields = wallet?.shields ?? 0;
    const boughtItems = wallet?.boughtItems ?? [];

    // Consumable Power-Up Purchase (Max 3 Shields allowed)
    if (item.itemType === "powerup") {
      if (currentShields >= MAX_STREAK_SHIELDS) {
        throw new ConvexError(
          `Maximum ${MAX_STREAK_SHIELDS} Streak Freeze Shields allowed in inventory!`
        );
      }

      if (currentCoins < item.price) {
        throw new ConvexError(
          `Not enough coins! You need ${item.price - currentCoins} more coins.`
        );
      }

      const now = Date.now();
      const updatedCoins = currentCoins - item.price;
      const updatedShields = currentShields + 1;

      if (wallet) {
        await ctx.db.patch(wallet._id, {
          coins: updatedCoins,
          shields: updatedShields,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("userWallets", {
          userId: user.userId,
          coins: updatedCoins,
          xp: 0,
          shields: updatedShields,
          boughtItems: [],
          updatedAt: now,
        });
      }

      await ctx.db.insert("coinTransactions", {
        userId: user.userId,
        type: "shop_spend",
        coinsDelta: -item.price,
        referenceId: `${item.itemKey}-${now}`,
        description: `Purchased ${item.title} (${updatedShields}/${MAX_STREAK_SHIELDS})`,
        createdAt: now,
      });

      return {
        success: true,
        remainingCoins: updatedCoins,
        shields: updatedShields,
        itemKey: item.itemKey,
        title: item.title,
      };
    }

    // One-Time Avatar Purchase
    if (boughtItems.includes(item.itemKey)) {
      throw new ConvexError(`You already own "${item.title}"!`);
    }

    if (currentCoins < item.price) {
      throw new ConvexError(
        `Not enough coins! You need ${item.price - currentCoins} more coins.`
      );
    }

    const now = Date.now();
    const updatedCoins = currentCoins - item.price;
    const updatedBought = [...boughtItems, item.itemKey];

    if (wallet) {
      await ctx.db.patch(wallet._id, {
        coins: updatedCoins,
        boughtItems: updatedBought,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userWallets", {
        userId: user.userId,
        coins: updatedCoins,
        xp: 0,
        shields: currentShields,
        boughtItems: updatedBought,
        updatedAt: now,
      });
    }

    await ctx.db.insert("coinTransactions", {
      userId: user.userId,
      type: "shop_spend",
      coinsDelta: -item.price,
      referenceId: `${item.itemKey}-${now}`,
      description: `Purchased Avatar: ${item.title}`,
      createdAt: now,
    });

    return {
      success: true,
      remainingCoins: updatedCoins,
      shields: currentShields,
      itemKey: item.itemKey,
      title: item.title,
    };
  },
});