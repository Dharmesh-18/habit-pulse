// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export interface CalendarDay {
  dateStr: string;   // "2026-11-12"
  dayNumber: string; // "01", "02", ... "12"
  weekday: string;   // "S", "M", "T", "W", "T", "F", "S"
  isToday: boolean;
  isFuture: boolean;
}

export function getDaysInMonth(year: number, monthIndex: number): CalendarDay[] {
  const todayStr = getTodayKey();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const days: CalendarDay[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, monthIndex, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    days.push({
      dateStr,
      dayNumber: dd,
      weekday: weekdays[d.getDay()],
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  return days;
}