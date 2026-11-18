// src/config/announcements.ts
import type { AppView } from "../components/layout/AppHeader";

export interface FeatureAnnouncement {
  /** Unique release key — changing this automatically re-shows the banner to all users */
  id: string;
  badge: string;
  title: string;
  description: string;
  /** Optional quick-navigation button inside the banner */
  action?: {
    label: string;
    targetView: AppView;
  };
  /** Set to false if you ever want to temporarily hide all banners */
  isActive: boolean;
}

export const LATEST_ANNOUNCEMENT: FeatureAnnouncement = {
  id: "2026-11-18-web-push-notifications",
  badge: "NEW",
  title: "Lock-Screen Push Reminders",
  description:
    "Never miss a habit! Enable Device Push Notifications in your Profile to get native alerts even when the app is closed.",
  action: {
    label: "Enable in Profile",
    targetView: "profile",
  },
  isActive: true,
};