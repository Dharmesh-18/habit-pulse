// src/lib/themes.ts
import {
  Sun,
  Trees,
  Moon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type ThemeId = "nova" | "forest" | "dark" | "space";

export interface AppTheme {
  id: ThemeId;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  description: string;
}

export const THEMES: AppTheme[] = [
  {
    id: "nova",
    label: "Nova",
    icon: Sun,
    iconColor: "text-indigo-500",
    description: "Classic soft tactile neumorphism",
  },
  {
    id: "forest",
    label: "Forest",
    icon: Trees,
    iconColor: "text-emerald-600",
    description: "Earthy green calm palette",
  },
  {
    id: "dark",
    label: "Dark",
    icon: Moon,
    iconColor: "text-blue-400",
    description: "Deep slate & midnight blue",
  },
  {
    id: "space",
    label: "Space",
    icon: Sparkles,
    iconColor: "text-purple-400",
    description: "Cosmic glassmorphism & shine",
  },
];

export function getThemeMeta(themeId: string): AppTheme {
  return THEMES.find((t) => t.id === themeId) || THEMES[0];
}