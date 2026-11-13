// src/App.tsx
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { AppHeader, type AppView } from "./components/layout/AppHeader";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfileView } from "./components/profile/ProfileView";
import { useToast } from "./context/ToastContext";

export function App() {
  const toast = useToast();
  const [token, setToken] = useState<string>(
    () => localStorage.getItem("habit_token") || ""
  );
  const [currentView, setCurrentView] = useState<AppView>("dashboard");

  const currentUser = useQuery(api.auth.index.getMe, {
    sessionToken: token || undefined,
  });

  const handleAuthSuccess = (newToken: string) => {
    localStorage.setItem("habit_token", newToken);
    setToken(newToken);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("habit_token");
    setToken("");
    setCurrentView("dashboard");
    toast.info("Logged out successfully");
  };

  // 1. Unauthenticated View -> AuthPage
  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // 2. Authenticated Layout -> Header + Active Page
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      <AppHeader
        userName={currentUser.name}
        avatarStorageId={currentUser.avatarStorageId}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
      />

      {currentView === "profile" ? (
        <ProfileView
          user={currentUser}
          sessionToken={token}
          onBack={() => setCurrentView("dashboard")}
        />
      ) : (
        <DashboardPage sessionToken={token} />
      )}
    </div>
  );
}

export default App;