// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    avatarStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  userSessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"]),

  habits: defineTable({
    userId: v.id("users"),
    title: v.string(),
    normalizedTitle: v.string(), // for case-insensitive dedup check
    category: v.string(), // Health, Study, Work, etc.
    reminderTime: v.optional(v.string()), // "HH:mm" 24h
    customImageStorageId: v.optional(v.id("_storage")), // custom icon
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
    timestamp: v.number(),
  })
    .index("by_habit_date", ["habitId", "date"])
    .index("by_user_date", ["userId", "date"]),

  // Production sliding window rate limiting
  rateLimits: defineTable({
    key: v.string(), // e.g., "ratelimit:userId:action"
    timestamps: v.array(v.number()),
  })
    .index("by_key", ["key"]),
});