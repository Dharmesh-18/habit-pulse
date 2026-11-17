// src/components/leaderboard/LeaderboardTable.tsx
import React from "react";
import { NeuCard } from "../ui/NeuCard";
import { UserAvatar } from "../ui/UserAvatar";
import { RankLaurelBadge } from "./RankLaurelBadge";
import type { LeaderboardEntry } from "../../../convex/leaderboard/index";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";
import { Trophy } from "lucide-react";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
}) => {
  return (
    <NeuCard className="p-0 overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-black/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-center text-neu-accent">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neu-dark">
              Top 10 Performers
            </h3>
            <p className="text-[11px] text-neu-muted">
              Live rankings updated in real time
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-neu-muted">
          Showing Top {entries.length}
        </span>
      </div>

      {/* Sleek Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-black/5 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-neu-muted bg-black/[0.015]">
              <th className="py-3 pl-3 sm:pl-6 pr-2 text-center w-16 sm:w-20">
                Rank
              </th>
              <th className="py-3 px-2 sm:px-4">Player</th>
              <th className="py-3 px-2 sm:px-4 text-center whitespace-nowrap">
                Task Done
              </th>
              <th className="py-3 pl-2 pr-3 sm:pr-6 text-right whitespace-nowrap">
                % Task Done
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black/5">
            {entries.map((entry) => (
              <tr
                key={entry.userId}
                className={cn(
                  "transition-colors hover:bg-black/[0.02]",
                  entry.isCurrentUser && "bg-neu-accent/[0.06]"
                )}
              >
                {/* 1. Rank (Gold/Silver/Bronze Laurel for 1-3, Pill for 4-10) */}
                <td className="py-3 pl-3 sm:pl-6 pr-2 text-center">
                  <RankLaurelBadge rank={entry.rank} />
                </td>

                {/* 2. Player (Small Avatar + Name) */}
                <td className="py-3 px-2 sm:px-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <UserAvatar
                      name={entry.name}
                      avatarStorageId={
                        entry.avatarStorageId as Id<"_storage"> | undefined
                      }
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-neu-dark truncate max-w-[125px] sm:max-w-[220px]">
                        {entry.name}
                      </p>
                      {entry.isCurrentUser && (
                        <span className="inline-block text-[10px] font-extrabold text-neu-accent">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* 3. Task Done (Completed / Total) */}
                <td className="py-3 px-2 sm:px-4 text-center whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-neu-bg shadow-neu-pressed-sm text-xs font-bold text-neu-dark">
                    {entry.completedTasks}
                    <span className="text-neu-muted font-normal mx-0.5">/</span>
                    {entry.totalTasks}
                  </span>
                </td>

                {/* 4. % Task Done (Mini Bar + Percentage) */}
                <td className="py-3 pl-2 pr-3 sm:pr-6 text-right whitespace-nowrap">
                  <div className="inline-flex items-center justify-end gap-2.5">
                    <div className="hidden sm:block w-20 h-2 rounded-full bg-neu-bg shadow-neu-pressed-sm overflow-hidden">
                      <div
                        className="h-full rounded-full bg-neu-accent transition-all duration-500"
                        style={{ width: `${entry.percentage}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-extrabold min-w-[40px] text-right",
                        entry.percentage === 100
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-neu-accent"
                      )}
                    >
                      {entry.percentage}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NeuCard>
  );
};