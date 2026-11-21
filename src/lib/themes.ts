// src/lib/themes.ts
import {
  Sun,
  Trees,
  Moon,
  Sparkles,
  Zap,
  Shield,
  Flame,
  Orbit,
  Crown,
  SunMedium,
  Gem,
  type LucideIcon,
} from "lucide-react";

export type ThemeId =
  | "nova"
  | "forest"
  | "dark"
  | "space"
  | "arc-reactor"
  | "spidey-verse"
  | "emerald-corps"
  | "xenomorph"
  | "obsidian-gold"
  | "vibranium"
  | "phoenix-force"
  | "matrix-oracle"
  | "celestial-prism"
  | "singularity";

export type ThemeUnlockRule =
  | { type: "free" }
  | { type: "streak"; minDays: number }
  | { type: "pro" };

export interface AppTheme {
  id: ThemeId;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  description: string;
  swatch: [string, string];
  unlockRule: ThemeUnlockRule;
  ambientOrbColors?: [string, string];
}

export const THEMES: AppTheme[] = [
  // --- STARTER THEMES (FREE) ---
  {
    id: "nova",
    label: "Nova",
    icon: Sun,
    iconColor: "text-indigo-500",
    description: "Classic soft tactile neumorphism",
    swatch: ["#e6ecf4", "#4f46e5"],
    unlockRule: { type: "free" },
  },
  {
    id: "forest",
    label: "Forest",
    icon: Trees,
    iconColor: "text-emerald-600",
    description: "Earthy green calm palette",
    swatch: ["#dfeae2", "#059669"],
    unlockRule: { type: "free" },
  },
  {
    id: "dark",
    label: "Dark",
    icon: Moon,
    iconColor: "text-blue-400",
    description: "Deep slate & midnight blue",
    swatch: ["#151922", "#3b82f6"],
    unlockRule: { type: "free" },
  },

  // --- STREAK-UNLOCKED COLLECTOR THEMES (3d – 50d) ---
  {
    id: "arc-reactor",
    label: "Arc Reactor",
    icon: Zap,
    iconColor: "text-cyan-400",
    description: "J.A.R.V.I.S. holographic cyan HUD",
    swatch: ["#040911", "#00d8ff"],
    unlockRule: { type: "streak", minDays: 3 },
    ambientOrbColors: ["rgba(0, 216, 255, 0.24)", "rgba(14, 165, 233, 0.16)"],
  },
  {
    id: "space",
    label: "Space",
    icon: Sparkles,
    iconColor: "text-purple-400",
    description: "Cosmic glassmorphism & shine",
    swatch: ["#080b14", "#a855f7"],
    unlockRule: { type: "streak", minDays: 7 },
    ambientOrbColors: ["rgba(168, 85, 247, 0.16)", "rgba(56, 189, 248, 0.12)"],
  },
  {
    id: "spidey-verse",
    label: "Spidey Verse",
    icon: Shield,
    iconColor: "text-rose-500",
    description: "Midnight suit navy & crimson web",
    swatch: ["#090e1c", "#e11d48"],
    unlockRule: { type: "streak", minDays: 14 },
    ambientOrbColors: ["rgba(225, 29, 72, 0.18)", "rgba(37, 99, 235, 0.16)"],
  },
  {
    id: "emerald-corps",
    label: "Emerald Corps",
    icon: Flame,
    iconColor: "text-emerald-400",
    description: "Obsidian void & willpower emerald",
    swatch: ["#050f0a", "#10b981"],
    unlockRule: { type: "streak", minDays: 21 },
    ambientOrbColors: ["rgba(16, 185, 129, 0.18)", "rgba(52, 211, 153, 0.11)"],
  },
  {
    id: "xenomorph",
    label: "Space Alien",
    icon: Orbit,
    iconColor: "text-yellow-300",
    description: "Charcoal comic ink & starlight yellow",
    swatch: ["#272a30", "#facc15"],
    unlockRule: { type: "streak", minDays: 30 },
    ambientOrbColors: ["rgba(250, 204, 21, 0.14)", "rgba(156, 163, 175, 0.14)"],
  },
  {
    id: "obsidian-gold",
    label: "Royal Gold",
    icon: Crown,
    iconColor: "text-amber-300",
    description: "24K champagne silk & burnished gold",
    swatch: ["#2e2010", "#fbbf24"],
    unlockRule: { type: "streak", minDays: 50 },
    ambientOrbColors: ["rgba(253, 224, 71, 0.24)", "rgba(217, 119, 6, 0.22)"],
  },

  // --- LEGENDARY MILESTONE THEMES (100d – 1000d) ---
  {
    id: "vibranium",
    label: "Sakura Kyoto",
    icon: Sparkles,
    iconColor: "text-pink-500",
    description: "Cherry blossom silk & warm rose ivory",
    swatch: ["#f6ecef", "#db2777"],
    unlockRule: { type: "streak", minDays: 100 },
    ambientOrbColors: ["rgba(219, 39, 119, 0.14)", "rgba(244, 114, 182, 0.14)"],
  },
  {
    id: "phoenix-force",
    label: "Terracotta Dusk",
    icon: SunMedium,
    iconColor: "text-orange-500",
    description: "Warm desert clay & burnt copper sunset",
    swatch: ["#1d110d", "#ea580c"],
    unlockRule: { type: "streak", minDays: 200 },
    ambientOrbColors: ["rgba(234, 88, 12, 0.24)", "rgba(244, 63, 94, 0.16)"],
  },
  {
    id: "matrix-oracle",
    label: "Arctic Glacier",
    icon: Shield,
    iconColor: "text-sky-600",
    description: "Crisp Nordic ice & deep fjord cobalt",
    swatch: ["#e3f0f8", "#0284c7"],
    unlockRule: { type: "streak", minDays: 365 },
    ambientOrbColors: ["rgba(2, 132, 199, 0.14)", "rgba(56, 189, 248, 0.14)"],
  },
  {
    id: "celestial-prism",
    label: "Celestial Prism",
    icon: Gem,
    iconColor: "text-pink-500",
    description: "Vivid rainbow spectrum & prism crystal",
    swatch: ["#f43f5e", "#0ea5e9"],
    unlockRule: { type: "streak", minDays: 1 },
    ambientOrbColors: ["rgba(244, 63, 94, 0.16)", "rgba(14, 165, 233, 0.16)"],
  },
  {
    id: "singularity",
    label: "Aether Sovereign",
    icon: Crown,
    iconColor: "text-amber-300",
    description: "1000-Day Aurora Borealis & Imperial Gold",
    swatch: ["#070b14", "#2dd4bf"],
    unlockRule: { type: "streak", minDays: 1000 },
    ambientOrbColors: ["rgba(45, 212, 191, 0.28)", "rgba(251, 191, 36, 0.24)"],
  },
];

export function getThemeMeta(themeId: string): AppTheme {
  return THEMES.find((t) => t.id === themeId) || THEMES[0];
}

export function isThemeUnlocked(
  theme: AppTheme,
  highestUnlockedMilestone: number,
  isProUser = false
): boolean {
  if (theme.unlockRule.type === "free") return true;
  if (theme.unlockRule.type === "streak") {
    return highestUnlockedMilestone >= theme.unlockRule.minDays;
  }
  if (theme.unlockRule.type === "pro") {
    return isProUser;
  }
  return false;
}

export function getThemesUnlockedAtMilestone(milestoneDays: number): AppTheme[] {
  return THEMES.filter(
    (t) => t.unlockRule.type === "streak" && t.unlockRule.minDays === milestoneDays
  );
}