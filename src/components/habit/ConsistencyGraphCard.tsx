// src/components/habit/ConsistencyGraphCard.tsx
import React, { useMemo, useState, useEffect } from "react";
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
  compactLabel: string; // "13"
  dayName: string; // "Fri"
  completedCount: number;
  totalActiveCount: number;
  percentage: number; // 0 to 100
}

function toLocalDateKey(timestampMs: number): string {
  const d = new Date(timestampMs);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getLastNDates(n: number): {
  dateKey: string;
  shortLabel: string;
  compactLabel: string;
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
    const compactLabel = String(d.getDate());
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    result.push({ dateKey, shortLabel, compactLabel, dayName });
  }
  return result;
}

export const ConsistencyGraphCard: React.FC<ConsistencyGraphCardProps> = ({
  habits,
}) => {
  const [range, setRange] = useState<RangeDays>(14);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // 1. Historical Date-Aware Calculation Engine
  const dataPoints: DailyConsistencyPoint[] = useMemo(() => {
    const dates = getLastNDates(range);

    return dates.map(({ dateKey, shortLabel, compactLabel, dayName }) => {
      let totalActiveCount = 0;
      let completedCount = 0;

      for (const habit of habits) {
        const createdMs = habit.createdAt ?? habit._creationTime ?? 0;
        const habitCreatedDateKey = createdMs
          ? toLocalDateKey(createdMs)
          : "1970-01-01";

        const isCompletedOnDate = Boolean(habit.logs?.[dateKey]);

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
        compactLabel,
        dayName,
        completedCount,
        totalActiveCount,
        percentage,
      };
    });
  }, [habits, range]);

  // 2. Summary Metrics
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

  // 3. Responsive SVG Coordinate Geometry (1:1 crisp scaling on mobile & desktop)
  const svgWidth = isMobile ? 380 : 760;
  const svgHeight = isMobile ? 210 : 215;
  const padLeft = isMobile ? 42 : 44;
  const padRight = isMobile ? 16 : 22;
  const padTop = 26;
  const padBottom = 36;
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
  }, [dataPoints, padLeft, chartW, chartH]);

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

  // Touch scrub handler for mobile fingers
  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!e.touches.length || coords.length === 0) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const touchX = e.touches[0].clientX - svgRect.left;
    const scaledX = (touchX / svgRect.width) * svgWidth;

    let nearestIdx = 0;
    let minDist = Infinity;
    for (const c of coords) {
      const dist = Math.abs(c.x - scaledX);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = c.idx;
      }
    }
    setHoveredIndex(nearestIdx);
  };

  return (
    <NeuCard className="flex flex-col gap-4 sm:gap-5 relative z-10 p-4 sm:p-6">
      {/* Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neu-bg shadow-neu-flat-sm flex items-center justify-center text-neu-accent shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neu-dark tracking-tight">
              Daily Consistency Curve
            </h2>
            <p className="text-[11px] sm:text-xs text-neu-muted">
              Calculated against each day&apos;s active habits
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Selected / Today's Completion (Full width on mobile for clarity) */}
        <div className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neu-muted block">
              {hoveredIndex !== null
                ? `${activePoint?.pt.shortLabel} (${activePoint?.pt.dayName})`
                : "Today's Completion"}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base sm:text-lg font-extrabold text-neu-dark">
                {activePoint?.pt.completedCount ?? 0} /{" "}
                {activePoint?.pt.totalActiveCount ?? 0}
              </span>
              <span className="text-xs font-bold text-neu-accent">
                ({activePoint?.pt.percentage ?? 0}%)
              </span>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-neu-accent opacity-80 shrink-0" />
        </div>

        {/* Period Average */}
        <div className="col-span-1 p-3 sm:p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neu-muted block">
              {range}D Avg
            </span>
            <span className="text-base sm:text-lg font-extrabold text-neu-dark mt-0.5 block">
              {stats.avgConsistency}%
            </span>
          </div>
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 opacity-80 shrink-0" />
        </div>

        {/* 100% Perfect Days */}
        <div className="col-span-1 p-3 sm:p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neu-muted block">
              100% Days
            </span>
            <span className="text-base sm:text-lg font-extrabold text-neu-dark mt-0.5 block">
              {stats.perfectDays}{" "}
              <span className="text-[11px] sm:text-xs font-normal text-neu-muted">
                / {range}d
              </span>
            </span>
          </div>
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 opacity-80 shrink-0" />
        </div>
      </div>

      {/* Interactive SVG Area Chart */}
      <div className="w-full pt-1 select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-52 overflow-visible touch-pan-y"
          onMouseLeave={() => setHoveredIndex(null)}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setHoveredIndex(null)}
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

          {/* Horizontal Y-Axis Grid Lines (0%, 50%, 100% on Mobile; 0%, 25%, 50%, 75%, 100% on Desktop) */}
          {(isMobile ? [0, 50, 100] : [0, 25, 50, 75, 100]).map((val) => {
            const y = padTop + chartH - (val / 100) * chartH;
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="var(--theme-muted)"
                  strokeOpacity={0.2}
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] sm:text-[11px] fill-neu-muted font-bold"
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
            strokeWidth={isMobile ? 2.5 : 3}
            strokeLinecap="round"
          />

          {/* Vertical Guide Line on Hover / Touch */}
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

            const showXLabel = isMobile
              ? (range === 7 && (idx % 2 === 0 || isToday)) ||
                (range === 14 && (idx % 3 === 0 || isToday)) ||
                (range === 30 && (idx % 7 === 0 || isToday))
              : range === 7 ||
                (range === 14 && idx % 2 === 0) ||
                (range === 30 && idx % 5 === 0) ||
                isToday;

            const colWidth = chartW / coords.length;

            // Prevent tooltip clipping near left/right edges on mobile
            const clampedTooltipX = Math.min(
              Math.max(x, padLeft + 34),
              svgWidth - padRight - 34
            );

            return (
              <g key={pt.dateKey}>
                {showXLabel && (
                  <text
                    x={x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className={cn(
                      "text-[11px] font-semibold transition-colors",
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
                  r={isHovered ? 6 : isToday ? 4.5 : isMobile ? 3 : 3.5}
                  fill="var(--theme-surface)"
                  stroke="var(--theme-accent)"
                  strokeWidth={isHovered || isToday ? 3 : 2}
                  className="transition-all duration-150"
                />

                {isHovered && (
                  <g
                    transform={`translate(${clampedTooltipX}, ${Math.max(
                      y - 26,
                      14
                    )})`}
                  >
                    <rect
                      x={-38}
                      y={-15}
                      width={76}
                      height={22}
                      rx={6}
                      fill="var(--theme-surface-elevated)"
                      stroke="var(--theme-border)"
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-neu-dark"
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
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neu-muted border-t border-black/5 pt-2.5">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-neu-accent shrink-0" />
          <span>
            {isMobile
              ? "Tap or drag on chart to inspect daily ratio"
              : "Hover over any point to inspect that day's exact habit ratio"}
          </span>
        </span>
        <span className="font-semibold text-neu-dark">
          Active Habits: {habits.length}
        </span>
      </div>
    </NeuCard>
  );
};