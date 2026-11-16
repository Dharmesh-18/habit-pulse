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
  id: "2026-11-16-notification-toggle",
  badge: "NEW",
  title: "Email Notification Controls",
  description:
    "Pause or resume habit creation alerts and daily reminder emails anytime from your account settings.",
  action: {
    label: "Manage in Profile",
    targetView: "profile",
  },
  isActive: true,
};