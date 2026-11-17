// src/pages/LeaderboardPage.tsx
import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { NeuCard } from "../components/ui/NeuCard";
import { LeaderboardHeroes } from "../components/leaderboard/LeaderboardHeroes";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";

interface LeaderboardPageProps {
  sessionToken: string;
}

function getTodayDateKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  sessionToken,
}) => {
  const todayKey = useMemo(() => getTodayDateKey(), []);

  const leaderboard = useQuery(
    api.leaderboard.index.getTopPerformers,
    sessionToken ? { sessionToken, date: todayKey } : "skip"
  );

  if (leaderboard === undefined) {
    return (
      <NeuCard className="py-16 text-center text-xs text-neu-muted">
        Loading live leaderboard rankings...
      </NeuCard>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <NeuCard inset className="py-16 text-center text-sm text-neu-muted">
        No active habits tracked yet today. Complete a habit on your Dashboard to
        claim the #1 spot!
      </NeuCard>
    );
  }

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <LeaderboardHeroes topThree={topThree} />
      <LeaderboardTable entries={leaderboard} />
    </div>
  );
};