// convex/auth/oauth.ts
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { ConvexError, v } from "convex/values";
import {
  OAuthProviderType,
  OAuthProviderVerifier,
  VerifiedOAuthProfile,
} from "./oauthTypes";

/**
 * 1. Google OAuth Strategy
 */
class GoogleOAuthVerifier implements OAuthProviderVerifier {
  provider = "google" as const;

  async verifyToken(accessToken: string): Promise<VerifiedOAuthProfile> {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new ConvexError("Failed to verify Google token. Please try again.");
    }

    const data = (await response.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!data.email || !data.email_verified || !data.sub) {
      throw new ConvexError("Your Google account does not have a verified email.");
    }

    return {
      provider: "google",
      providerAccountId: data.sub,
      email: data.email.toLowerCase().trim(),
      name: data.name || data.email.split("@")[0],
      avatarUrl: data.picture,
    };
  }
}

/**
 * Registry of OAuth Providers
 * Future: Add GitHubOAuthVerifier, FacebookOAuthVerifier here
 */
const oauthVerifiers: Record<string, OAuthProviderVerifier> = {
  google: new GoogleOAuthVerifier(),
};

/**
 * Public Action called by the Frontend for any Social Login
 */
export const signInWithOAuth = action({
  args: {
    provider: v.union(
      v.literal("google"),
      v.literal("github"),
      v.literal("facebook")
    ),
    accessToken: v.string(),
  },
  handler: async (ctx, args): Promise<{ token: string; user: { id: string; name: string; email: string } }> => {
    const verifier = oauthVerifiers[args.provider as OAuthProviderType];
    if (!verifier) {
      throw new ConvexError(`OAuth provider "${args.provider}" is not configured yet.`);
    }

    // 1. Verify token with the external OAuth provider (Google/GitHub/etc.)
    const profile = await verifier.verifyToken(args.accessToken);

    // 2. Upsert user & issue a standard HabitPulse session token
    return await ctx.runMutation(internal.auth.index.upsertOAuthUser, {
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });
  },
});