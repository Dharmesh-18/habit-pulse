// src/components/tour/tourSlides.tsx
import React from "react";
import {
  CalendarCheck2,
  Flame,
  BellRing,
  Snowflake,
  Award,
  Store,
  FileText,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { MatrixVisual } from "./slides/MatrixVisual";
import { ChallengesVisual } from "./slides/ChallengesVisual";
import { RemindersVisual } from "./slides/RemindersVisual";
import { StreakFreezeVisual } from "./slides/StreakFreezeVisual";
import { MilestonesVisual } from "./slides/MilestonesVisual";
import { ShopWalletVisual } from "./slides/ShopWalletVisual";
import { AiReportVisual } from "./slides/AiReportVisual";
import { LeaderboardVisual } from "./slides/LeaderboardVisual";

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
      "Track multiple daily habits on an interactive monthly grid and watch your daily completion percentage plot live on the consistency curve.",
    icon: CalendarCheck2,
    accentColor: "text-neu-accent",
    Visual: MatrixVisual,
  },
  {
    id: "streak-challenges",
    badge: "Challenges Arena",
    title: "Solo, Duo & Clan Streak Challenges",
    description:
      "Commit to strict no-freeze challenges solo, with a buddy, or a 5-member clan. Nudge pending teammates via push & email and conquer the streak to win huge coin jackpots!",
    icon: Flame,
    accentColor: "text-orange-500",
    Visual: ChallengesVisual,
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
    badge: "Streak Protection",
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
      "Hit streak milestones along your progress timeline to unlock custom app themes and shareable achievement cards.",
    icon: Award,
    accentColor: "text-amber-500",
    Visual: MilestonesVisual,
  },
  {
    id: "coins-shop",
    badge: "Rewards Shop",
    title: "Earn Coins & XP, Unlock Shop Gear",
    description:
      "Every check-in awards +5 Coins and +10 XP. Spend coins in the Shop on Streak Freeze Shields, 20+ avatars, or top-up coin packs.",
    icon: Store,
    accentColor: "text-emerald-500",
    Visual: ShopWalletVisual,
  },
  {
    id: "ai-pulse-report",
    badge: "AI Insights",
    title: "AI Pulse Coach PDF Reports",
    description:
      "Redeem your earned coins to generate personalized weekly and monthly AI performance PDFs with deep habit breakdowns.",
    icon: FileText,
    accentColor: "text-purple-500",
    Visual: AiReportVisual,
  },
  {
    id: "xp-leaderboard",
    badge: "Community Ranks",
    title: "Global Top 10 XP Leaderboard",
    description:
      "Stay consistent to grow your total XP and climb the live Top 10 Leaderboard alongside dedicated habit builders.",
    icon: Trophy,
    accentColor: "text-amber-600",
    Visual: LeaderboardVisual,
  },
];