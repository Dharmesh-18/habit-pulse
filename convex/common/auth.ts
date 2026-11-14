// convex/common/auth.ts
import { type MutationCtx, type QueryCtx } from "../_generated/server";
import { type Id } from "../_generated/dataModel";

export interface AuthenticatedUser {
  userId: Id<"users">;
  email: string;
  name: string;
  // role: "admin" | "user";
}

export async function authenticate(
  ctx: QueryCtx | MutationCtx,
  sessionToken?: string
): Promise<AuthenticatedUser> {
  if (!sessionToken) {
    throw new Error("UNAUTHORIZED: Missing session token");
  }

  const session = await ctx.db
    .query("userSessions")
    .withIndex("by_token", (q) => q.eq("token", sessionToken))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("UNAUTHORIZED: Session expired or invalid");
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    throw new Error("UNAUTHORIZED: User does not exist");
  }

  return {
    userId: user._id,
    email: user.email,
    name: user.name,
    // role: user.role,
  };
}

export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  sessionToken?: string
): Promise<AuthenticatedUser> {
  const user = await authenticate(ctx, sessionToken);
  // if (user.role !== "admin") {
  //   throw new Error("FORBIDDEN: Admin permissions required");
  // }
  return user;
}