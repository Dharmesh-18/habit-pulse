// src/components/layout/ProtectedShell.tsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { FeatureBanner } from "../ui/FeatureBanner";
import type { Id } from "../../../convex/_generated/dataModel";

interface ProtectedShellProps {
  userName: string;
  avatarStorageId?: Id<"_storage">;
  onLogout: () => void;
}

export const ProtectedShell: React.FC<ProtectedShellProps> = ({
  userName,
  avatarStorageId,
  onLogout,
}) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <div className="min-h-dvh flex flex-col">
      <AppHeader
        userName={userName}
        avatarStorageId={avatarStorageId}
        onLogout={onLogout}
      />

      <div className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 pt-5 sm:pt-7 pb-24 md:pb-10 flex flex-col md:flex-row gap-6">
        <AppSidebar />

        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {isDashboard && <FeatureBanner />}
          <Outlet />
        </div>
      </div>
    </div>
  );
};