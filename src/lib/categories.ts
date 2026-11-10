// src/lib/categories.ts
import { 
  HeartPulse, 
  BookOpen, 
  Briefcase, 
  Wallet, 
  Users, 
  Sparkles, 
  type LucideIcon 
} from "lucide-react";

export interface HabitCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const CATEGORIES: HabitCategory[] = [
  { id: "health", label: "Health", icon: HeartPulse, color: "text-rose-500" },
  { id: "study", label: "Study", icon: BookOpen, color: "text-sky-500" },
  { id: "work", label: "Work", icon: Briefcase, color: "text-amber-500" },
  { id: "finance", label: "Finance", icon: Wallet, color: "text-emerald-500" },
  { id: "relation", label: "Relation", icon: Users, color: "text-purple-500" },
  { id: "other", label: "Other", icon: Sparkles, color: "text-indigo-500" },
];

export function getCategoryMeta(catId: string): HabitCategory {
  const found = CATEGORIES.find(
    (c) => c.id.toLowerCase() === catId.toLowerCase() || c.label.toLowerCase() === catId.toLowerCase()
  );
  return found || CATEGORIES[5]; // fallback to 'other'
}