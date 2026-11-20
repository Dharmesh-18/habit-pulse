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
  id: "2026-11-20-shop-items-v2",
  badge: "NEW",
  title: "Buy coins and unlock exclusive items(BETA)!",
  description:
    "Buy and earn coins and unlock exclusive avatars, themes, and more in the shop. Check out the new items now!",
  action: {
    label: "View Shop",
    targetView: "shop",
  },
  isActive: true,
};