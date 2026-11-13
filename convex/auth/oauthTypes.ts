// convex/auth/oauthTypes.ts

export type OAuthProviderType = "google" | "github" | "facebook";

export interface VerifiedOAuthProfile {
  provider: OAuthProviderType;
  providerAccountId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface OAuthProviderVerifier {
  provider: OAuthProviderType;
  verifyToken(accessToken: string): Promise<VerifiedOAuthProfile>;
}