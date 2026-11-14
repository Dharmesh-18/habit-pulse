// convex/common/rateLimiter.ts
import { type MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";

interface RateLimitConfig {
  key: string;
  maxRequests: number;
  windowMs: number;
}

export async function assertRateLimit(
  ctx: MutationCtx,
  config: RateLimitConfig,
) {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", config.key))
    .first();

  if (!existing) {
    await ctx.db.insert("rateLimits", {
      key: config.key,
      timestamps: [now],
    });
    return;
  }

  // Filter timestamps within current window
  const validTimestamps = existing.timestamps.filter((ts) => ts > windowStart);

  if (validTimestamps.length >= config.maxRequests) {
    throw new ConvexError(
      `Rate limit reached. Max ${config.maxRequests} requests per ${config.windowMs / 1000}s.`,
    );
  }

  validTimestamps.push(now);
  await ctx.db.patch(existing._id, { timestamps: validTimestamps });
}
