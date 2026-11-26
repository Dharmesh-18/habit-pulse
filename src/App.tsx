// src/App.tsx
import { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ProtectedShell } from "./components/layout/ProtectedShell";
import {
  PrivacyPolicyPage,
  TermsPage,
  RefundPolicyPage,
  ContactPage,
} from "./pages/LegalPages";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ProfileView } from "./components/profile/ProfileView";
import { useToast } from "./context/ToastContext";
import { AchievementsPage } from "./pages/AchievementsPage";
import { ShopPage } from "./pages/ShopPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { ChallengeInvitePage } from "./pages/ChallengeInvitePage";

export function App() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState<string>(
    () => localStorage.getItem("habit_token") || "",
  );

  const handleAuthSuccess = (newToken: string) => {
    localStorage.setItem("habit_token", newToken);
    setToken(newToken);
    const pendingPath = localStorage.getItem("pending_challenge_redirect");
    if (pendingPath) {
      localStorage.removeItem("pending_challenge_redirect");
      navigate(pendingPath, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const currentUser = useQuery(api.auth.index.getMe, {
    sessionToken: token || undefined,
  });

  // 1. Public Legal Pages (must stay BEFORE auth guard for Razorpay & crawlers)
  if (location.pathname === "/privacy") return <PrivacyPolicyPage />;
  if (location.pathname === "/terms") return <TermsPage />;
  if (location.pathname === "/refunds") return <RefundPolicyPage />;
  if (location.pathname === "/contact") return <ContactPage />;

  // 2. Auth Guard (preserves /challenge/:inviteCode across login/signup)
  if (!currentUser) {
    if (location.pathname.startsWith("/challenge/")) {
      localStorage.setItem("pending_challenge_redirect", location.pathname);
    }
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const handleLogout = () => {
    localStorage.removeItem("habit_token");
    setToken("");
    navigate("/", { replace: true });
    toast.info("Logged out successfully");
  };

  return (
    <Routes>
      <Route
        element={
          <ProtectedShell
            userName={currentUser.name}
            avatarStorageId={currentUser.avatarStorageId}
            presetAvatarId={currentUser.presetAvatarId}
            sessionToken={token}
            onLogout={handleLogout}
          />
        }
      >
        <Route path="/" element={<DashboardPage sessionToken={token} />} />
        <Route path="/challenges" element={<ChallengesPage sessionToken={token} />} />
        <Route path="/challenge/:inviteCode" element={<ChallengeInvitePage sessionToken={token} />} />
        <Route path="/achievements" element={<AchievementsPage sessionToken={token} />} />
        <Route path="/leaderboard" element={<LeaderboardPage sessionToken={token} />} />
        <Route path="/shop" element={<ShopPage sessionToken={token} />} />
        <Route
          path="/profile"
          element={
            <ProfileView
              user={currentUser}
              sessionToken={token}
              onBack={() => navigate("/")}
              onLogout={handleLogout}
            />
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;