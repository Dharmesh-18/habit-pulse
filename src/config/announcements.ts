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
  id: "2026-11-17-live-leaderboard",
  badge: "NEW",
  title: "Live Community Leaderboard",
  description:
    "Compete in real time! Claim the #1 Champion Crown.",
  action: {
    label: "View Leaderboard",
    targetView: "leaderboard"
  },
  isActive: true,
};