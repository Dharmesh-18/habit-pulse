// src/components/challenges/ChallengeSection.tsx
import React from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { Flame, ArrowRight, Plus } from "lucide-react";
import { api } from "../../../convex/_generated/api";

function getLocalTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface ChallengeSectionProps {
  sessionToken: string;
}

export const ChallengeSection: React.FC<ChallengeSectionProps> = ({
  sessionToken,
}) => {
  const navigate = useNavigate();
  const todayDate = getLocalTodayStr();

  const challenges = useQuery(
    api.challenges.index.listMyChallenges,
    sessionToken ? { sessionToken, todayDate } : "skip"
  );

  if (challenges === undefined) return null;

  const activeCount = challenges.filter(
    (c) => c.effectiveStatus === "active"
  ).length;
  const pendingCheckIns = challenges.filter(
    (c) => c.effectiveStatus === "active" && !c.myCheckedInToday
  ).length;
  const waitingInvites = challenges.filter(
    (c) => c.effectiveStatus === "pending"
  ).length;

  return (
    <div
      onClick={() => navigate("/challenges")}
      className="px-4 py-3 rounded-2xl bg-neu-bg shadow-neu-flat hover:shadow-neu-flat-lg border border-black/5 flex items-center justify-between gap-3 cursor-pointer transition-all"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-neu-accent/15 text-neu-accent flex items-center justify-center shrink-0">
          <Flame className="w-4 h-4 stroke-[2.5]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-extrabold text-neu-dark">
              Streak Challenges
            </span>

            {pendingCheckIns > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-extrabold tabular-nums">
                {pendingCheckIns} Due Today
              </span>
            )}
          </div>

          <p className="text-[11px] text-neu-muted truncate">
            {activeCount > 0 || waitingInvites > 0
              ? `${activeCount} Active${
                  waitingInvites > 0 ? ` • ${waitingInvites} Waiting Invite` : ""
                } — Tap to view streak timelines`
              : "Solo, Duo Buddy & Clan challenges • Win bonus coin jackpots"}
          </p>
        </div>
      </div>

      <span className="px-3 py-1.5 rounded-xl bg-neu-bg shadow-neu-flat-sm text-xs font-extrabold text-neu-accent inline-flex items-center gap-1 shrink-0">
        {challenges.length === 0 ? (
          <>
            <Plus className="w-3.5 h-3.5" />
            <span>Start</span>
          </>
        ) : (
          <>
            <span>Open</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </span>
    </div>
  );
};