import React from "react";
import { cn } from "../../lib/utils";

interface HeatmapGridProps {
  logs: Record<string, boolean>; // date -> completed
  daysCount?: number;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({ logs, daysCount = 30 }) => {
  // Generate date keys for past N days
  const days = React.useMemo(() => {
    const list: { dateStr: string; label: string }[] = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      list.push({
        dateStr: `${year}-${month}-${day}`,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
    return list;
  }, [daysCount]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {days.map((d) => {
          const isDone = logs[d.dateStr] === true;
          return (
            <div
              key={d.dateStr}
              title={`${d.label}: ${isDone ? "Completed" : "Not Done"}`}
              className={cn(
                "w-4 h-4 rounded-md transition-all duration-200 cursor-pointer",
                isDone
                  ? "bg-neu-accent shadow-[0_0_8px_rgba(79,70,229,0.5)] scale-105"
                  : "bg-neu-bg shadow-neu-pressed-sm border border-black/5 hover:border-black/20"
              )}
            />
          );
        })}
      </div>
      <div className="flex justify-between items-center text-[10px] text-neu-muted font-medium px-0.5">
        <span>{days[0]?.label}</span>
        <span>{days[days.length - 1]?.label} (Today)</span>
      </div>
    </div>
  );
};