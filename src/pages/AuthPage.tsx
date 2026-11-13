// src/pages/AuthPage.tsx
import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { NeuCard } from "../components/ui/NeuCard";
import { NeuButton } from "../components/ui/NeuButton";
import { NeuInput } from "../components/ui/NeuInput";
import { NeuThemeSelect } from "../components/ui/NeuThemeSelect";
import { SocialAuthButtons } from "../components/auth/SocialAuthButtons";
import { Flame } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { parseConvexError } from "../lib/errorUtils";

interface AuthPageProps {
  onAuthSuccess: (token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const toast = useToast();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginMutation = useMutation(api.auth.index.login);
  const registerMutation = useMutation(api.auth.index.register);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (authMode === "login") {
        const res = await loginMutation({ email, password });
        toast.success(`Welcome back, ${res.name}!`);
        onAuthSuccess(res.token);
      } else {
        const res = await registerMutation({ email, password, name });
        toast.success("Account created successfully!");
        onAuthSuccess(res.token);
      }
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 relative">
      {/* Top Bar for Theme Switching on Auth Screen */}
      <div className="w-full max-w-4xl mx-auto flex justify-end pt-2">
        <NeuThemeSelect />
      </div>

      {/* Centered Auth Card */}
      <div className="flex-1 flex items-center justify-center py-6">
        <NeuCard className="w-full max-w-md flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-12 h-12 rounded-2xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent mb-2">
              <Flame className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-bold text-neu-dark tracking-tight">
              Habit Pulse
            </h1>
            <p className="text-xs text-neu-muted">
              Track your habits, build your future
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            {authMode === "register" && (
              <NeuInput
                label="Full Name"
                placeholder="Dharmesh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <NeuInput
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <NeuInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <NeuButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="mt-2 w-full"
            >
              {isSubmitting
                ? "Please wait..."
                : authMode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </NeuButton>
          </form>

          {/* Google / Social Login Integration */}
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <SocialAuthButtons
              onSuccess={onAuthSuccess}
              disabled={isSubmitting}
            />
          )}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
              className="text-xs font-semibold text-neu-muted hover:text-neu-dark transition-colors"
            >
              {authMode === "login"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </NeuCard>
      </div>

      <div className="h-6" />
    </div>
  );
};