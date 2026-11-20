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
  id: "2026-11-20-shop-items-v1",
  badge: "NEW",
  title: "Earn coins and unlock exclusive items!",
  description:
    "Complete daily tasks to earn coins and unlock exclusive avatars, themes, and more in the shop. Check out the new items now!",
  action: {
    label: "View Shop",
    targetView: "shop",
  },
  isActive: true,
};