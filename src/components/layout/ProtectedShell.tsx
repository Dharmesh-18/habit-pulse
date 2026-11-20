// src/components/layout/ProtectedShell.tsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { FeatureBanner } from "../ui/FeatureBanner";
import type { Id } from "../../../convex/_generated/dataModel";
import { ThemeAmbientBackdrop } from "../ui/ThemeAmbientBackdrop";

interface ProtectedShellProps {
  userName: string;
  avatarStorageId?: Id<"_storage">;
  presetAvatarId?: string;
  sessionToken: string;
  onLogout: () => void;
}

export const ProtectedShell: React.FC<ProtectedShellProps> = ({
  userName,
  avatarStorageId,
  presetAvatarId,
  sessionToken,
  onLogout,
}) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <div className="min-h-dvh flex flex-col relative">
      <ThemeAmbientBackdrop />

      <div className="relative z-10 flex flex-col flex-1">
        <AppHeader
          userName={userName}
          avatarStorageId={avatarStorageId}
          presetAvatarId={presetAvatarId}
          sessionToken={sessionToken}
        />

        <div className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 pt-5 sm:pt-7 pb-24 md:pb-10 flex flex-col md:flex-row gap-6">
          <AppSidebar />

          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {isDashboard && <FeatureBanner />}
            <Outlet context={{ onLogout }}/>
          </div>
        </div>
      </div>
    </div>
  );
};