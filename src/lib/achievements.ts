// src/lib/achievements.ts
export interface MilestoneTierMeta {
  days: number;
  title: string;
  subtitle: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
}

export const MILESTONE_TIERS: Record<number, MilestoneTierMeta> = {
  1: {
    days: 1,
    title: "First Spark",
    subtitle: "Day 1 Ignition",
    primaryColor: "#EA580C",
    secondaryColor: "#FDBA74",
    glowColor: "rgba(234, 88, 12, 0.35)",
  },
  3: {
    days: 3,
    title: "Momentum Builder",
    subtitle: "3-Day Rhythm",
    primaryColor: "#D97706",
    secondaryColor: "#FCD34D",
    glowColor: "rgba(217, 119, 6, 0.35)",
  },
  7: {
    days: 7,
    title: "Week Warrior",
    subtitle: "7-Day Discipline",
    primaryColor: "#4F46E5",
    secondaryColor: "#A5B4FC",
    glowColor: "rgba(79, 70, 229, 0.4)",
  },
  14: {
    days: 14,
    title: "Fortnight Force",
    subtitle: "14-Day Consistency",
    primaryColor: "#0284C7",
    secondaryColor: "#7DD3FC",
    glowColor: "rgba(2, 132, 199, 0.4)",
  },
  21: {
    days: 21,
    title: "Habit Formed",
    subtitle: "21-Day Neural Lock",
    primaryColor: "#059669",
    secondaryColor: "#6EE7B7",
    glowColor: "rgba(5, 150, 105, 0.4)",
  },
  30: {
    days: 30,
    title: "Monthly Master",
    subtitle: "30-Day Unbroken",
    primaryColor: "#7C3AED",
    secondaryColor: "#C4B5FD",
    glowColor: "rgba(124, 58, 237, 0.45)",
  },
  50: {
    days: 50,
    title: "Half-Century",
    subtitle: "50-Day Grit",
    primaryColor: "#E11D48",
    secondaryColor: "#FDA4AF",
    glowColor: "rgba(225, 29, 72, 0.45)",
  },
  100: {
    days: 100,
    title: "Centurion",
    subtitle: "100-Day Elite",
    primaryColor: "#CA8A04",
    secondaryColor: "#FEF08A",
    glowColor: "rgba(202, 138, 4, 0.5)",
  },
  200: {
    days: 200,
    title: "Unstoppable",
    subtitle: "200-Day Fortress",
    primaryColor: "#0D9488",
    secondaryColor: "#99F6E4",
    glowColor: "rgba(13, 148, 136, 0.45)",
  },
  365: {
    days: 365,
    title: "Year Legend",
    subtitle: "365-Day Mastery",
    primaryColor: "#2563EB",
    secondaryColor: "#93C5FD",
    glowColor: "rgba(37, 99, 235, 0.5)",
  },
  500: {
    days: 500,
    title: "Titan",
    subtitle: "500-Day Iron Will",
    primaryColor: "#9333EA",
    secondaryColor: "#E9D5FF",
    glowColor: "rgba(147, 51, 234, 0.5)",
  },
  1000: {
    days: 1000,
    title: "Immortal",
    subtitle: "1000-Day Mythic",
    primaryColor: "#B45309",
    secondaryColor: "#FDE68A",
    glowColor: "rgba(180, 83, 9, 0.55)",
  },
};

export function getMilestoneMeta(days: number): MilestoneTierMeta {
  return (
    MILESTONE_TIERS[days] ?? {
      days,
      title: `${days}-Day Streak`,
      subtitle: "Milestone Unlocked",
      primaryColor: "#4F46E5",
      secondaryColor: "#A5B4FC",
      glowColor: "rgba(79, 70, 229, 0.35)",
    }
  );
}