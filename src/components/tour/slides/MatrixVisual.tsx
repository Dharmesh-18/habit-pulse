// src/components/tour/slides/MatrixVisual.tsx
import React, { useEffect, useState } from "react";
import { Check, TrendingUp } from "lucide-react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const HABITS = ["Workout", "Deep Work", "Read 20m", "Hydrate"];

// Each column = 1 day (4 rows = 4 habits). Realistic peaks & dips!
const DAY_COMPLETIONS: boolean[][] = [
  [true, true, true, true],     // Mon: 4/4 = 100%
  [true, true, false, true],    // Tue: 3/4 = 75%
  [true, true, true, true],     // Wed: 4/4 = 100%
  [true, false, true, false],   // Thu: 2/4 = 50%
  [true, true, true, true],     // Fri: 4/4 = 100%
  [true, true, true, false],    // Sat: 3/4 = 75%
  [true, true, true, true],     // Sun: 4/4 = 100%
];

export const MatrixVisual: React.FC = () => {
  // Revealed columns count from 1 to 7
  const [revealedDays, setRevealedDays] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setRevealedDays((prev) => (prev >= 7 ? 1 : prev + 1));
    }, 900);
    return () => clearInterval(timer);
  }, []);

  const activeDayIdx = revealedDays - 1;
  const activeDoneCount =
    DAY_COMPLETIONS[activeDayIdx].filter(Boolean).length;
  const activePct = Math.round((activeDoneCount / HABITS.length) * 100);

  // Build SVG coordinates for the Consistency Curve (width 210, height 34)
  const chartWidth = 210;
  const chartHeight = 34;
  const padX = 12;
  const padY = 5;
  const stepX = (chartWidth - padX * 2) / (DAYS.length - 1);

  const points = Array.from({ length: revealedDays }, (_, dayIdx) => {
    const done = DAY_COMPLETIONS[dayIdx].filter(Boolean).length;
    const pct = done / HABITS.length; // 0 to 1
    const x = padX + dayIdx * stepX;
    const y = padY + (1 - pct) * (chartHeight - padY * 2);
    return { x, y, pct };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints =
    points.length > 0
      ? `${points[0].x},${chartHeight} ${polylinePoints} ${points[points.length - 1].x},${chartHeight}`
      : "";

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col gap-2.5 p-3 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {/* Header showing current day's completion % */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-extrabold text-neu-dark">
          4 Daily Habits • 7-Day Grid
        </span>
        <span className="text-[10px] font-extrabold text-neu-accent px-2 py-0.5 rounded-full bg-neu-accent/10 tabular-nums">
          {DAYS[activeDayIdx]}: {activeDoneCount}/4 ({activePct}%)
        </span>
      </div>

      {/* Compact 4-Row x 7-Column Matrix */}
      <div className="flex flex-col gap-1">
        {/* Weekday Header Row */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-neu-muted text-left">
            Habit
          </span>
          {DAYS.map((day, dIdx) => (
            <span
              key={dIdx}
              className={`text-[9px] font-extrabold text-center transition-colors ${
                dIdx === activeDayIdx ? "text-neu-accent" : "text-neu-muted"
              }`}
            >
              {day}
            </span>
          ))}
        </div>

        {/* 4 Habit Rows */}
        {HABITS.map((habitName, hIdx) => (
          <div
            key={habitName}
            className="grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1"
          >
            <span className="text-[9px] font-bold text-neu-dark truncate text-left">
              {habitName}
            </span>

            {DAYS.map((_, dIdx) => {
              const isRevealed = dIdx < revealedDays;
              const isDone = isRevealed && DAY_COMPLETIONS[dIdx][hIdx];
              const isCurrentCol = dIdx === activeDayIdx;

              return (
                <div
                  key={dIdx}
                  className={`w-5 h-5 mx-auto rounded-md flex items-center justify-center transition-all duration-300 ${
                    isDone
                      ? "bg-neu-accent text-white shadow-[0_0_6px_rgba(79,70,229,0.4)]"
                      : "bg-neu-bg shadow-neu-pressed-sm text-transparent"
                  } ${isCurrentCol ? "scale-105 ring-1 ring-neu-accent/35" : ""}`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Live Daily Consistency Curve (Peaks & Dips) */}
      <div className="pt-1.5 border-t border-black/5 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[9px] font-bold text-neu-muted">
          <span className="flex items-center gap-1 text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>Daily Consistency Curve</span>
          </span>
          <span className="tabular-nums">100% / 75% / 50%</span>
        </div>

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-8 overflow-visible"
        >
          <defs>
            <linearGradient id="tourCurveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(79, 70, 229)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="rgb(79, 70, 229)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Subtle 50% & 100% reference guide lines */}
          <line
            x1={padX}
            y1={padY}
            x2={chartWidth - padX}
            y2={padY}
            stroke="currentColor"
            className="text-black/10"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <line
            x1={padX}
            y1={chartHeight / 2}
            x2={chartWidth - padX}
            y2={chartHeight / 2}
            stroke="currentColor"
            className="text-black/10"
            strokeDasharray="2 2"
            strokeWidth="1"
          />

          {/* Shaded Area under curve */}
          {points.length > 1 && (
            <polygon points={areaPoints} fill="url(#tourCurveFill)" />
          )}

          {/* Consistency Line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="rgb(79, 70, 229)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {/* Data Dots per Day */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={idx === activeDayIdx ? 3.2 : 2.2}
              className={
                p.pct === 1
                  ? "fill-emerald-500 stroke-white"
                  : "fill-neu-accent stroke-white"
              }
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};