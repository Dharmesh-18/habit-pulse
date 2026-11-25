// src/components/tour/tourSlides.tsx
import React from "react";
import {
  CalendarCheck2,
  BellRing,
  Snowflake,
  Award,
  Store,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { MatrixVisual } from "./slides/MatrixVisual";
import { RemindersVisual } from "./slides/RemindersVisual";
import { StreakFreezeVisual } from "./slides/StreakFreezeVisual";
import { MilestonesVisual } from "./slides/MilestonesVisual";
import { ShopWalletVisual } from "./slides/ShopWalletVisual";
import { AiLeaderboardVisual } from "./slides/AiLeaderboardVisual";

export interface TourSlideConfig {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentColor: string;
  Visual: React.FC;
}

export const TOUR_SLIDES: TourSlideConfig[] = [
  {
    id: "habit-matrix",
    badge: "Core Tracking",
    title: "Daily Habit Grid & Consistency Curve",
    description:
      "Log habits in one tap on your interactive monthly matrix and watch your daily consistency curve climb in real time.",
    icon: CalendarCheck2,
    accentColor: "text-neu-accent",
    Visual: MatrixVisual,
  },
  {
    id: "smart-reminders",
    badge: "Never Miss a Beat",
    title: "Push & Email Smart Reminders",
    description:
      "Set custom daily reminder times per habit. Receive instant mobile push alerts and emails—automatically skipped if already completed.",
    icon: BellRing,
    accentColor: "text-indigo-500",
    Visual: RemindersVisual,
  },
  {
    id: "streak-freeze",
    badge: "New Power-Up",
    title: "Streak Freeze Shield ❄️",
    description:
      "Busy day? Tap the snowflake icon on a missed yesterday to bridge your streak chain without losing hard-earned progress.",
    icon: Snowflake,
    accentColor: "text-sky-500",
    Visual: StreakFreezeVisual,
  },
  {
    id: "milestones-themes",
    badge: "Progression",
    title: "Streak Milestones, Themes & Share Cards",
    description:
      "Hit 7, 21, 30, and 100+ day streaks to unlock custom app themes and download shareable achievement cards.",
    icon: Award,
    accentColor: "text-amber-500",
    Visual: MilestonesVisual,
  },
  {
    id: "coins-shop",
    badge: "Gamified Rewards",
    title: "Earn Coins & XP, Unlock Shop Gear",
    description:
      "Every check-in awards +5 Coins and +10 XP. Spend coins in the Rewards Shop on Streak Freeze Shields and 20+ collectible avatars.",
    icon: Store,
    accentColor: "text-emerald-500",
    Visual: ShopWalletVisual,
  },
  {
    id: "ai-leaderboard",
    badge: "Insights & Community",
    title: "AI Pulse Coach Reports & Top 10 Ranks",
    description:
      "Generate personalized weekly & monthly AI performance PDFs and compete on the global Top 10 XP Leaderboard.",
    icon: Sparkles,
    accentColor: "text-purple-500",
    Visual: AiLeaderboardVisual,
  },
];