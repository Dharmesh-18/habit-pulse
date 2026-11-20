// src/App.tsx
import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ProtectedShell } from "./components/layout/ProtectedShell";
import { useLocation } from "react-router-dom";
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

export function App() {
  const toast = useToast();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>(
    () => localStorage.getItem("habit_token") || "",
  );

  const currentUser = useQuery(api.auth.index.getMe, {
    sessionToken: token || undefined,
  });

  const handleAuthSuccess = (newToken: string) => {
    localStorage.setItem("habit_token", newToken);
    setToken(newToken);
    navigate("/", { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem("habit_token");
    setToken("");
    navigate("/", { replace: true });
    toast.info("Logged out successfully");
  };

  const location = useLocation();

  if (location.pathname === "/privacy") return <PrivacyPolicyPage />;
  if (location.pathname === "/terms") return <TermsPage />;
  if (location.pathname === "/refunds") return <RefundPolicyPage />;
  if (location.pathname === "/contact") return <ContactPage />;

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

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
        <Route path="/achievements" element={<AchievementsPage sessionToken={token} />} />
        <Route
          path="/leaderboard"
          element={<LeaderboardPage sessionToken={token} />}
        />

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
