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
  id: "2026-11-16-pwa-mobile-experience",
  badge: "NEW",
  title: "Install Habit Pulse as an App",
  description:
    "Habit Pulse is now mobile-optimized! Tap Install in the header (or Add to Home Screen) for a fast, native app experience.",
  isActive: true,
};