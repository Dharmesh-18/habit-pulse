// src/components/habit/ConsistencyGraphCard.tsx
import React, { useMemo, useState } from "react";
import { NeuCard } from "../ui/NeuCard";
import type { HabitItem } from "./HabitMatrix";
import { TrendingUp, CheckCircle2, Flame, Calendar } from "lucide-react";
import { cn } from "../../lib/utils";

interface ConsistencyGraphCardProps {
  habits: HabitItem[];
}

type RangeDays = 7 | 14 | 30;

interface DailyConsistencyPoint {
  dateKey: string; // "2026-11-13"
  shortLabel: string; // "13 Nov"
  dayName: string; // "Fri"
  completedCount: number;
  totalActiveCount: number;
  percentage: number; // 0 to 100
}

/**
 * Converts an Epoch timestamp (ms) into local "YYYY-MM-DD" string
 */
function toLocalDateKey(timestampMs: number): string {
  const d = new Date(timestampMs);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Generates an array of the last N local dates ending today (oldest -> today)
 */
function getLastNDates(n: number): {
  dateKey: string;
  shortLabel: string;
  dayName: string;
}[] {
  const result = [];
  const now = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateKey = toLocalDateKey(d.getTime());
    const shortLabel = d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    result.push({ dateKey, shortLabel, dayName });
  }
  return result;
}

export const ConsistencyGraphCard: React.FC<ConsistencyGraphCardProps> = ({
  habits,
}) => {
  const [range, setRange] = useState<RangeDays>(14);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Historical Date-Aware Calculation Engine using `habit.logs[dateKey]`
  const dataPoints: DailyConsistencyPoint[] = useMemo(() => {
    const dates = getLastNDates(range);

    return dates.map(({ dateKey, shortLabel, dayName }) => {
      let totalActiveCount = 0;
      let completedCount = 0;

      for (const habit of habits) {
        const createdMs = habit.createdAt ?? habit._creationTime ?? 0;
        const habitCreatedDateKey = createdMs
          ? toLocalDateKey(createdMs)
          : "1970-01-01";

        // O(1) dictionary lookup on `logs: Record<string, boolean>`
        const isCompletedOnDate = Boolean(habit.logs?.[dateKey]);

        // Habit counts on dateKey ONLY if it existed on/before dateKey,
        // OR if the user back-marked it completed on dateKey
        if (habitCreatedDateKey <= dateKey || isCompletedOnDate) {
          totalActiveCount++;
          if (isCompletedOnDate) {
            completedCount++;
          }
        }
      }

      const percentage =
        totalActiveCount > 0
          ? Math.round((completedCount / totalActiveCount) * 100)
          : 0;

      return {
        dateKey,
        shortLabel,
        dayName,
        completedCount,
        totalActiveCount,
        percentage,
      };
    });
  }, [habits, range]);

  // 2. Summary Metrics (Average Consistency & Perfect 100% Days)
  const stats = useMemo(() => {
    const activeDays = dataPoints.filter((d) => d.totalActiveCount > 0);
    const avgConsistency =
      activeDays.length > 0
        ? Math.round(
            activeDays.reduce((acc, cur) => acc + cur.percentage, 0) /
              activeDays.length
          )
        : 0;

    const perfectDays = activeDays.filter((d) => d.percentage === 100).length;

    return {
      avgConsistency,
      perfectDays,
    };
  }, [dataPoints]);

  // 3. SVG Coordinate Geometry
  const svgWidth = 760;
  const svgHeight = 210;
  const padLeft = 38;
  const padRight = 20;
  const padTop = 24;
  const padBottom = 34;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const coords = useMemo(() => {
    const count = dataPoints.length;
    return dataPoints.map((pt, idx) => {
      const x =
        padLeft + (count > 1 ? (idx / (count - 1)) * chartW : chartW / 2);
      const y = padTop + chartH - (pt.percentage / 100) * chartH;
      return { x, y, pt, idx };
    });
  }, [dataPoints, chartW, chartH]);

  // Smooth Cubic Bezier SVG Path
  const { linePath, areaPath } = useMemo(() => {
    if (coords.length === 0) return { linePath: "", areaPath: "" };
    if (coords.length === 1) {
      const p = coords[0];
      return {
        linePath: `M ${p.x} ${p.y}`,
        areaPath: `M ${p.x} ${padTop + chartH} L ${p.x} ${p.y} L ${p.x} ${padTop + chartH} Z`,
      };
    }

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const ctrlX1 = curr.x + (next.x - curr.x) * 0.45;
      const ctrlY1 = curr.y;
      const ctrlX2 = curr.x + (next.x - curr.x) * 0.55;
      const ctrlY2 = next.y;
      d += ` C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${next.x} ${next.y}`;
    }

    const baselineY = padTop + chartH;
    const area = `${d} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`;

    return { linePath: d, areaPath: area };
  }, [coords, chartH]);

  const activePoint =
    hoveredIndex !== null ? coords[hoveredIndex] : coords[coords.length - 1];

  return (
    <NeuCard className="flex flex-col gap-5 relative z-10">
      {/* Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-center justify-center text-neu-accent shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neu-dark tracking-tight">
              Daily Consistency Curve
            </h2>
            <p className="text-xs text-neu-muted">
              Calculated dynamically against each day&apos;s active habits
            </p>
          </div>
        </div>

        {/* 7D / 14D / 30D Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neu-bg shadow-neu-pressed-sm self-start sm:self-auto">
          {([7, 14, 30] as RangeDays[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setRange(d);
                setHoveredIndex(null);
              }}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                range === d
                  ? "bg-neu-bg text-neu-accent shadow-neu-flat-sm"
                  : "text-neu-muted hover:text-neu-dark"
              )}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Selected / Today's Completion */}
        <div className="p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neu-muted block">
              {hoveredIndex !== null
                ? `${activePoint?.pt.shortLabel} (${activePoint?.pt.dayName})`
                : "Today's Completion"}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-extrabold text-neu-dark">
                {activePoint?.pt.completedCount ?? 0} /{" "}
                {activePoint?.pt.totalActiveCount ?? 0}
              </span>
              <span className="text-xs font-bold text-neu-accent">
                ({activePoint?.pt.percentage ?? 0}%)
              </span>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-neu-accent opacity-80" />
        </div>

        {/* Period Average */}
        <div className="p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neu-muted block">
              {range}-Day Average
            </span>
            <span className="text-lg font-extrabold text-neu-dark mt-0.5 block">
              {stats.avgConsistency}%
            </span>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-500 opacity-80" />
        </div>

        {/* 100% Perfect Days */}
        <div className="p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neu-muted block">
              100% Perfect Days
            </span>
            <span className="text-lg font-extrabold text-neu-dark mt-0.5 block">
              {stats.perfectDays}{" "}
              <span className="text-xs font-normal text-neu-muted">
                / {range} days
              </span>
            </span>
          </div>
          <Flame className="w-5 h-5 text-amber-500 opacity-80" />
        </div>
      </div>

      {/* Interactive SVG Area Chart */}
      <div className="w-full pt-1 select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="consistencyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--theme-accent)"
                stopOpacity="0.36"
              />
              <stop
                offset="100%"
                stopColor="var(--theme-accent)"
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Horizontal Y-Axis Grid Lines (0%, 25%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = padTop + chartH - (val / 100) * chartH;
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="var(--theme-muted)"
                  strokeOpacity={0.18}
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-neu-muted font-semibold"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Shaded Gradient Area */}
          <path d={areaPath} fill="url(#consistencyAreaGrad)" />

          {/* Smooth Bezier Line */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--theme-accent)"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Vertical Guide Line on Hover */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + chartH}
              stroke="var(--theme-accent)"
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}

          {/* Nodes & Hover Hit Columns */}
          {coords.map(({ x, y, pt, idx }) => {
            const isHovered = hoveredIndex === idx;
            const isToday = idx === coords.length - 1;
            const showXLabel =
              range === 7 ||
              (range === 14 && idx % 2 === 0) ||
              (range === 30 && idx % 5 === 0) ||
              isToday;

            const colWidth = chartW / coords.length;

            return (
              <g key={pt.dateKey}>
                {showXLabel && (
                  <text
                    x={x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className={cn(
                      "text-[10px] font-semibold transition-colors",
                      isHovered || isToday
                        ? "fill-neu-accent font-bold"
                        : "fill-neu-muted"
                    )}
                  >
                    {isToday ? "Today" : pt.shortLabel}
                  </text>
                )}

                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : isToday ? 4.5 : 3.5}
                  fill="var(--theme-surface)"
                  stroke="var(--theme-accent)"
                  strokeWidth={isHovered || isToday ? 3 : 2}
                  className="transition-all duration-150"
                />

                {isHovered && (
                  <g transform={`translate(${x}, ${Math.max(y - 26, 14)})`}>
                    <rect
                      x={-36}
                      y={-14}
                      width={72}
                      height={20}
                      rx={6}
                      fill="var(--theme-surface-elevated)"
                      stroke="var(--theme-border)"
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-neu-dark"
                    >
                      {pt.completedCount}/{pt.totalActiveCount} ({pt.percentage}%)
                    </text>
                  </g>
                )}

                <rect
                  x={x - colWidth / 2}
                  y={padTop}
                  width={colWidth}
                  height={chartH + 20}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onClick={() => setHoveredIndex(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-neu-muted border-t border-black/5 pt-2.5">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-neu-accent" />
          Hover over any point to inspect that day&apos;s exact habit ratio
        </span>
        <span className="font-semibold text-neu-dark">
          Active Habits Today: {habits.length}
        </span>
      </div>
    </NeuCard>
  );
};