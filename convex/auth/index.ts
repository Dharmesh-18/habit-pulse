// convex/auth/index.ts
import { mutation, query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { assertRateLimit } from "../common/rateLimiter";

// Fast string hashing for portable environment
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "SALT_PEPPER_KEY_CONVEX");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
  },
  handler: async (ctx, args) => {
    // 1. IP / Email Rate Limit
    await assertRateLimit(ctx, {
      key: `register:${args.email.toLowerCase().trim()}`,
      maxRequests: 5,
      windowMs: 60 * 1000,
    });

    const email = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      throw new ConvexError("User with this email already exists");
    }

    const passwordHash = await hashPassword(args.password);
    const userId = await ctx.db.insert("users", {
      email,
      name: args.name.trim(),
      passwordHash,
      role: args.role ?? "user",
      createdAt: Date.now(),
    });

    // Generate Session Token
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert("userSessions", {
      userId,
      token,
      expiresAt,
    });

    return { token, name: args.name, email, role: args.role ?? "user" };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Prevent brute force
    await assertRateLimit(ctx, {
      key: `login:${email}`,
      maxRequests: 5,
      windowMs: 60 * 1000,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new ConvexError("Invalid email or password");
    }

    const hash = await hashPassword(args.password);
    if (user.passwordHash !== hash) {
      throw new ConvexError("Invalid email or password");
    }

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("userSessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    return { token, name: user.name, email: user.email, role: user.role };
  },
});

export const getMe = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken!))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarStorageId: user.avatarStorageId,
    };
  },
});

// 1. Mutation to update profile info (name & avatar)
export const updateProfile = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError("UNAUTHORIZED: Session expired or invalid");
    }

    const trimmedName = args.name.trim();
    if (!trimmedName) {
      throw new ConvexError("Name cannot be empty");
    }

    const patchData: { name: string; avatarStorageId?: any } = {
      name: trimmedName,
    };

    if (args.avatarStorageId !== undefined) {
      patchData.avatarStorageId = args.avatarStorageId;
    }

    await ctx.db.patch(session.userId, patchData);

    return { success: true };
  },
});