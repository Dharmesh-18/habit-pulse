// src/pages/ChallengeInvitePage.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { Flame, Users, ShieldAlert, Coins, ArrowLeft } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { NeuCard } from "../components/ui/NeuCard";
import { NeuButton } from "../components/ui/NeuButton";
import { UserAvatar } from "../components/ui/UserAvatar";
import { useToast } from "../context/ToastContext";
import { parseConvexError } from "../lib/errorUtils";

function getLocalTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface ChallengeInvitePageProps {
  sessionToken: string;
}

export const ChallengeInvitePage: React.FC<ChallengeInvitePageProps> = ({
  sessionToken,
}) => {
  const { inviteCode = "" } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [isJoining, setIsJoining] = useState(false);

  const preview = useQuery(
    api.challenges.index.getByInviteCode,
    inviteCode ? { inviteCode } : "skip"
  );

  const joinMutation = useMutation(api.challenges.index.joinChallengeByCode);

  const handleAccept = async () => {
    try {
      setIsJoining(true);
      const res = await joinMutation({
        sessionToken,
        inviteCode,
        todayDate: getLocalTodayStr(),
      });
      toast.success(`🔥 Joined "${res.title}"! Day 1 starts today!`);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 flex flex-col gap-5">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-neu-muted hover:text-neu-dark w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      {preview === undefined ? (
        <NeuCard className="p-8 text-center text-xs text-neu-muted">
          Loading challenge invite...
        </NeuCard>
      ) : preview === null ? (
        <NeuCard className="p-8 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-extrabold text-neu-dark">
            Invalid Invite Code
          </p>
          <p className="text-xs text-neu-muted">
            This challenge link does not exist.
          </p>
          <NeuButton size="sm" onClick={() => navigate("/")}>
            Go Home
          </NeuButton>
        </NeuCard>
      ) : (
        <NeuCard className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neu-accent/15 text-neu-accent flex items-center justify-center">
            <Flame className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-neu-accent/10 text-neu-accent text-[10px] font-extrabold uppercase tracking-wider">
              {preview.mode === "duo" ? "Duo Buddy Invite" : "Clan Squad Invite"}
            </span>
            <h2 className="text-lg font-extrabold text-neu-dark mt-1.5">
              {preview.title}
            </h2>
            <p className="text-xs font-bold text-neu-muted mt-0.5">
              {preview.durationDays} Days • {preview.category}
            </p>
          </div>

          {/* Current Squad Members */}
          <div className="w-full p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex flex-col items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neu-muted flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>
                Squad ({preview.members.length}/{preview.maxParticipants})
              </span>
            </span>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              {preview.members.map((m) => (
                <div key={m.userId} className="flex items-center gap-1.5">
                  <UserAvatar
                    name={m.name}
                    avatarStorageId={m.avatarStorageId}
                    presetAvatarId={m.presetAvatarId}
                    size="sm"
                  />
                  <span className="text-xs font-extrabold text-neu-dark">
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules Strip */}
          <div className="w-full flex flex-col gap-1.5 text-left text-[11px] text-neu-muted px-1">
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Earn <strong>+5 Coins/day</strong> + a huge{" "}
                <strong>Completion Jackpot</strong> at Day {preview.durationDays}!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>
                Strict commitment: <strong>No Streak Freeze</strong> allowed.
              </span>
            </div>
          </div>

          {preview.status === "expired" ? (
            <div className="w-full py-2.5 rounded-xl bg-rose-500/15 text-rose-600 text-xs font-extrabold">
              This invite expired (24-hour limit passed).
            </div>
          ) : (
            <NeuButton
              type="button"
              variant="primary"
              disabled={isJoining}
              onClick={handleAccept}
              className="w-full py-3 font-extrabold"
            >
              {isJoining ? "Joining Challenge..." : "Accept & Start Challenge 🔥"}
            </NeuButton>
          )}
        </NeuCard>
      )}
    </div>
  );
};