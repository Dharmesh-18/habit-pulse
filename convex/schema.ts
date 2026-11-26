// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.optional(v.string()), // Optional for OAuth users
    authProvider: v.optional(v.string()), // "credentials" | "google" | "github" | "facebook"
    providerAccountId: v.optional(v.string()),
    externalAvatarUrl: v.optional(v.string()), // Google/GitHub profile picture URL
    avatarStorageId: v.optional(v.id("_storage")),
    presetAvatarId: v.optional(v.string()), // Equipped shop avatar itemKey (e.g. "avatar-coco")
    notificationPreferences: v.optional(
      v.object({
        enabled: v.optional(v.boolean()),
      }),
    ),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  userSessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  habits: defineTable({
    userId: v.id("users"),
    title: v.string(),
    normalizedTitle: v.string(), // for case-insensitive dedup check
    category: v.string(), // Health, Study, Work, etc.
    reminderTime: v.optional(v.string()), // "HH:mm" 24h
    customImageStorageId: v.optional(v.id("_storage")), // custom icon
    longestStreak: v.optional(v.number()), // Best streak achieved on this habit
    version: v.number(), // Optimistic Concurrency Control (OCC)
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId", "isArchived"])
    .index("by_user_title", ["userId", "normalizedTitle"]),

  habitLogs: defineTable({
    habitId: v.id("habits"),
    userId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD"
    completed: v.boolean(),
    isFrozen: v.optional(v.boolean()), // True when protected via Streak Freeze Shield
    timestamp: v.number(),
  })
    .index("by_habit_date", ["habitId", "date"])
    .index("by_user_date", ["userId", "date"]),

  // Production sliding window rate limiting
  rateLimits: defineTable({
    key: v.string(), // e.g., "ratelimit:userId:action"
    timestamps: v.array(v.number()),
  }).index("by_key", ["key"]),

  // Push subscription storage for web push notifications
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // Permanent habit streak milestone achievements
  habitAchievements: defineTable({
    userId: v.id("users"),
    habitId: v.id("habits"),
    milestone: v.number(), // 1, 3, 7, 14, 21, 30, 50, 100, 200, 365, 500, 1000
    unlockedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_habit", ["habitId"])
    .index("by_habit_milestone", ["habitId", "milestone"]),

  // User Gamification Wallet (Spendable Coins, Monotonic XP & Purchased Item Keys)
  userWallets: defineTable({
    userId: v.id("users"),
    coins: v.number(),
    xp: v.number(),
    shields: v.optional(v.number()), // Streak Freeze Shield inventory (0 to 3)
    boughtItems: v.array(v.string()), // Array of shopItems.itemKey
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Extensible Shop Catalog (Avatars now; Frames, Badges, Power-ups later)
  shopItems: defineTable({
    itemKey: v.string(), // Unique stable slug, e.g. "avatar-coco"
    title: v.string(), // e.g. "Coco", "Knight", "Savior"
    itemType: v.string(), // "avatar" (extensible to "frame" | "badge" | "powerup")
    price: v.number(),
    assetPath: v.string(), // e.g. "/avatars/coco.svg"
    sortOrder: v.number(),
    isActive: v.boolean(),
  })
    .index("by_item_key", ["itemKey"])
    .index("by_type_active", ["itemType", "isActive"]),

  // Real-money payment orders (Razorpay order lifecycle)
  paymentOrders: defineTable({
    userId: v.id("users"),
    provider: v.string(), // "razorpay"
    orderId: v.string(), // Razorpay order_id (e.g. "order_xxx")
    paymentId: v.optional(v.string()), // Razorpay payment_id (e.g. "pay_xxx")
    packageKey: v.string(), // e.g. "pack-200"
    amountPaise: v.number(), // e.g. 4900 for ₹49
    currency: v.string(), // "INR"
    coins: v.number(), // Coins to credit on success
    status: v.union(
      v.literal("created"),
      v.literal("paid"),
      v.literal("failed"),
    ),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
  })
    .index("by_order_id", ["orderId"])
    .index("by_user", ["userId"]),

  // Immutable Coin Audit Ledger
  coinTransactions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("purchase"),
      v.literal("habit_reward"),
      v.literal("shop_spend"),
      v.literal("challenge_reward"),
    ),
    coinsDelta: v.number(), // +200 for purchase, -50 for spend
    referenceId: v.string(), // orderId or itemKey
    description: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Unified Challenges: Solo (1), Duo (2), Clan (up to 5)
  challenges: defineTable({
    creatorId: v.id("users"),
    mode: v.union(v.literal("solo"), v.literal("duo"), v.literal("clan")),
    maxParticipants: v.number(), // 1 | 2 | 5
    inviteCode: v.string(), // Unique 6-char uppercase code
    title: v.string(),
    category: v.string(),
    durationDays: v.number(), // 7 | 14 | 21 | 30
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("expired"),
    ),
    startDate: v.optional(v.string()), // "YYYY-MM-DD" (user local date on start)
    endDate: v.optional(v.string()), // "YYYY-MM-DD"
    expiresAt: v.number(), // createdAt + 24h for pending invites
    rewardType: v.union(
      v.literal("coins"),
      v.literal("voucher"),
      v.literal("cash"),
    ),
    rewardValue: v.optional(v.number()), // Assigned jackpot coins on completion
    failedReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_invite_code", ["inviteCode"])
    .index("by_status", ["status"])
    .index("by_creator", ["creatorId"]),

  // Challenge Membership (scales cleanly from 1 to N members)
  challengeParticipants: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    role: v.union(v.literal("creator"), v.literal("member")),
    joinedAt: v.number(),
    rewardClaimed: v.boolean(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_challenge_user", ["challengeId", "userId"]),

  // Daily Check-in Logs per Participant
  challengeLogs: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD"
    completedAt: v.number(),
  })
    .index("by_challenge_date", ["challengeId", "date"])
    .index("by_challenge_user_date", ["challengeId", "userId", "date"]),
});
