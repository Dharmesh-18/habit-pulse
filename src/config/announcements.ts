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
  id: "2026-11-20-ai-reports-v1",
  badge: "NEW",
  title: "AI Generated Report!",
  description:
    "Get your AI generated report on weekly and monthly basis for performance tracking!",
  action: {
    label: "Get Mine",
    targetView: "profile",
  },
  isActive: true,
};