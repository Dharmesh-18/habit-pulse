// src/components/auth/SocialAuthButtons.tsx
import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "../../context/ToastContext";
import { parseConvexError } from "../../lib/errorUtils";
import { cn } from "../../lib/utils";

interface SocialAuthButtonsProps {
  onSuccess: (token: string) => void;
  disabled?: boolean;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
    />
  </svg>
);

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onSuccess,
  disabled = false,
}) => {
  const toast = useToast();
  const signInWithOAuth = useAction(api.auth.oauth.signInWithOAuth);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoadingProvider("google");
        const result = await signInWithOAuth({
          provider: "google",
          accessToken: tokenResponse.access_token,
        });
        toast.success(`Welcome, ${result.user.name}!`);
        onSuccess(result.token);
      } catch (err: unknown) {
        toast.error(parseConvexError(err));
      } finally {
        setLoadingProvider(null);
      }
    },
    onError: () => {
      toast.error("Google sign-in was cancelled or failed.");
      setLoadingProvider(null);
    },
  });

  const isBusy = disabled || Boolean(loadingProvider);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Divider */}
      <div className="relative flex items-center justify-center my-1">
        <div className="border-t border-black/10 dark:border-white/10 w-full" />
        <span className="bg-neu-bg px-3 text-[11px] font-bold uppercase tracking-wider text-neu-muted shrink-0">
          Or continue with
        </span>
        <div className="border-t border-black/10 dark:border-white/10 w-full" />
      </div>

      {/* Tactile Google OAuth Button */}
      <button
        type="button"
        disabled={isBusy}
        onClick={() => loginWithGoogle()}
        className={cn(
          "w-full h-11 px-4 rounded-xl bg-neu-bg text-neu-dark text-sm font-semibold",
          "shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed",
          "flex items-center justify-center gap-3 transition-all duration-200 outline-none",
          isBusy && "opacity-60 cursor-not-allowed"
        )}
      >
        <GoogleIcon className="w-4 h-4 shrink-0" />
        <span>
          {loadingProvider === "google"
            ? "Connecting to Google..."
            : "Continue with Google"}
        </span>
      </button>
    </div>
  );
};