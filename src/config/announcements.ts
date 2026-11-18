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
  id: "2026-11-18-streak-achievements-v2",
  badge: "NEW",
  title: "Streak Achievements & Shareable Badges",
  description:
    "Unlock & Share Streak Medals (1 to 1,000 days), share CARDS on WhatsApp/Instagram!",
  action: {
    label: "View Achievements",
    targetView: "achievements",
  },
  isActive: true,
};