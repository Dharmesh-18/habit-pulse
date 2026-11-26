// src/pages/ChallengesPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import confetti from "canvas-confetti";
import {
  Flame,
  Plus,
  Check,
  Clock,
  Copy,
  Trophy,
  XCircle,
  X,
  Users,
  User,
  Coins,
  ShieldAlert,
  Lock,
  LogOut,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { NeuCard } from "../components/ui/NeuCard";
import { UserAvatar } from "../components/ui/UserAvatar";
import { CreateChallengeModal } from "../components/challenges/CreateChallengeModal";
import { useToast } from "../context/ToastContext";
import { parseConvexError } from "../lib/errorUtils";
import { soundFX } from "../lib/soundEffects";
import { ConfirmActionModal } from "../components/ui/ConfirmActionModal";

function getLocalTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildChallengeTimeline(
  startDate: string | undefined,
  durationDays: number,
): { dayNum: number; dateStr: string | null; shortLabel: string }[] {
  return Array.from({ length: durationDays }, (_, idx) => {
    const dayNum = idx + 1;
    if (!startDate) {
      return { dayNum, dateStr: null, shortLabel: `D${dayNum}` };
    }
    const [y, m, d] = startDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + idx));
    const dateStr = dt.toISOString().slice(0, 10);
    const shortLabel = dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    return { dayNum, dateStr, shortLabel };
  });
}

interface HorizontalStreakRowProps {
  startDate?: string;
  durationDays: number;
  todayDate: string;
  isActive: boolean;
  myCompletedDates: string[];
  allCompletedDates: string[];
  isMultiplayer: boolean;
  canCheckInToday: boolean;
  onTapToday: () => void;
}

const HorizontalStreakRow: React.FC<HorizontalStreakRowProps> = ({
  startDate,
  durationDays,
  todayDate,
  isActive,
  myCompletedDates,
  allCompletedDates,
  isMultiplayer,
  canCheckInToday,
  onTapToday,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayCellRef = useRef<HTMLButtonElement>(null);

  const days = buildChallengeTimeline(startDate, durationDays);
  const mySet = new Set(myCompletedDates);
  const allSet = new Set(allCompletedDates);

  // Auto-scroll to center today's cell on mount
  useEffect(() => {
    if (todayCellRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cell = todayCellRef.current;
      const offset =
        cell.offsetLeft - container.clientWidth / 2 + cell.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
    }
  }, [todayDate, startDate]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold text-neu-muted px-0.5">
        <span>Streak Timeline (Scroll → End)</span>
        {isMultiplayer && (
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All Done</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neu-accent" />
              <span>You Done</span>
            </span>
          </span>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto py-2 px-2.5 rounded-xl bg-neu-bg shadow-neu-pressed-sm scrollbar-none"
      >
        {days.map((item) => {
          const isToday = item.dateStr === todayDate;
          const isFuture = item.dateStr !== null && item.dateStr > todayDate;
          const isMyDone = item.dateStr !== null && mySet.has(item.dateStr);
          const isAllDone = item.dateStr !== null && allSet.has(item.dateStr);

          const isClickableToday = isToday && isActive && canCheckInToday;

          return (
            <button
              key={item.dayNum}
              ref={isToday ? todayCellRef : undefined}
              type="button"
              disabled={!isClickableToday}
              onClick={isClickableToday ? onTapToday : undefined}
              title={
                item.dateStr
                  ? `Day ${item.dayNum} (${item.dateStr})`
                  : `Day ${item.dayNum}`
              }
              className={`shrink-0 w-11 py-1.5 rounded-xl flex flex-col items-center gap-1 transition-all ${
                isAllDone
                  ? "bg-emerald-500 text-white shadow-sm"
                  : isMyDone
                    ? "bg-neu-accent text-white shadow-sm"
                    : isToday && isActive
                      ? "bg-neu-bg shadow-neu-flat ring-2 ring-neu-accent/60 text-neu-accent cursor-pointer active:scale-95"
                      : "bg-neu-bg shadow-neu-flat-sm text-neu-muted opacity-65 cursor-default"
              }`}
            >
              <span className="text-[9px] font-extrabold uppercase tracking-tight">
                D{item.dayNum}
              </span>

              <div className="w-5 h-5 rounded-md flex items-center justify-center">
                {isMyDone || isAllDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isToday && isActive ? (
                  <span className="w-2 h-2 rounded-full bg-neu-accent animate-ping" />
                ) : isFuture || !startDate ? (
                  <Lock className="w-2.5 h-2.5 opacity-60" />
                ) : (
                  <X className="w-3 h-3 text-rose-500 stroke-[2.5]" />
                )}
              </div>

              <span className="text-[8px] font-bold opacity-85 tabular-nums">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface ChallengesPageProps {
  sessionToken: string;
}

export const ChallengesPage: React.FC<ChallengesPageProps> = ({
  sessionToken,
}) => {
  const toast = useToast();
  const todayDate = getLocalTodayStr();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "done">(
    "all",
  );
  const [confirmTarget, setConfirmTarget] = useState<{
    challengeId: Id<"challenges">;
    title: string;
    type: "quit" | "cancel_invite";
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const challenges = useQuery(
    api.challenges.index.listMyChallenges,
    sessionToken ? { sessionToken, todayDate } : "skip",
  );

  const checkInMutation = useMutation(api.challenges.index.checkInChallenge);
  const dismissMutation = useMutation(
    api.challenges.index.leaveOrCancelChallenge,
  );

  const handleCheckIn = async (
    challengeId: Id<"challenges">,
    title: string,
  ) => {
    try {
      setCheckingId(challengeId);
      const res = await checkInMutation({
        sessionToken,
        challengeId,
        todayDate,
      });

      if (res.challengeCompleted) {
        soundFX.achievementUnlock();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        toast.success(
          `🏆 JACKPOT! "${title}" completed! +${res.jackpotAwarded} Bonus Coins credited!`,
        );
      } else {
        soundFX.checkHabit();
        toast.success(
          `🔥 Checked in "${title}" (+${res.dailyCoins} Coins, +${res.dailyXp} XP)`,
        );
      }
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setCheckingId(null);
    }
  };

  const handleCopyInvite = async (inviteCode: string) => {
    const url = `${window.location.origin}/challenge/${inviteCode}`;
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied! Share with your buddy.");
  };

  const executeRemoveChallenge = async (challengeId: Id<"challenges">) => {
  await dismissMutation({ sessionToken, challengeId });
};

// 1. Direct dismiss for already finished (Completed / Broken / Expired) cards
const handleDismiss = async (challengeId: Id<"challenges">) => {
  try {
    await executeRemoveChallenge(challengeId);
  } catch (err: unknown) {
    toast.error(parseConvexError(err));
  }
};

// 2. Modal-confirmed quit/cancel for Active or Pending cards
const handleConfirmLeaveOrCancel = async () => {
  if (!confirmTarget) return;
  try {
    setIsConfirming(true);
    await executeRemoveChallenge(confirmTarget.challengeId);
    toast.info(
      confirmTarget.type === "quit"
        ? `Left "${confirmTarget.title}"`
        : `Invite for "${confirmTarget.title}" cancelled`
    );
    setConfirmTarget(null);
  } catch (err: unknown) {
    toast.error(parseConvexError(err));
  } finally {
    setIsConfirming(false);
  }
};

  const filteredChallenges = (challenges ?? []).filter((c) => {
    if (filter === "active") return c.effectiveStatus === "active";
    if (filter === "pending") return c.effectiveStatus === "pending";
    if (filter === "done")
      return ["completed", "failed", "expired"].includes(c.effectiveStatus);
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent">
            <Flame className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-neu-dark tracking-tight">
              Streak Challenges Arena
            </h1>
            <p className="text-xs text-neu-muted flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>
                Strict no-freeze mode • Complete streaks for Coin Jackpots
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neu-accent text-white shadow-neu-flat-sm active:scale-95 text-xs font-extrabold transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Challenge</span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "pending", label: "Waiting Invites" },
          { id: "done", label: "History" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              filter === tab.id
                ? "bg-neu-bg shadow-neu-pressed text-neu-accent"
                : "bg-neu-bg shadow-neu-flat-sm text-neu-muted hover:text-neu-dark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenges List */}
      {challenges === undefined ? (
        <p className="text-xs text-neu-muted text-center py-10">
          Loading challenges...
        </p>
      ) : filteredChallenges.length === 0 ? (
        <NeuCard
          inset
          className="p-10 text-center flex flex-col items-center gap-3"
        >
          <Trophy className="w-8 h-8 text-amber-500" />
          <p className="text-sm font-extrabold text-neu-dark">
            No challenges in this view yet
          </p>
          <p className="text-xs text-neu-muted max-w-sm">
            Start a Solo, Duo Buddy, or Clan Squad challenge to build
            unbreakable streaks and win bonus coin jackpots.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-1 px-4 py-2 rounded-xl bg-neu-accent text-white text-xs font-extrabold"
          >
            + Start Your First Challenge
          </button>
        </NeuCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredChallenges.map((c) => {
            const status = c.effectiveStatus;
            const isActive = status === "active";
            const isPending = status === "pending";
            const isCompleted = status === "completed";
            const isFailed = status === "failed" || status === "expired";

            return (
              <NeuCard
                key={c._id}
                className="p-4 flex flex-col justify-between gap-3.5 border border-black/5"
              >
                {/* Card Header */}
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neu-accent/10 text-neu-accent text-[10px] font-extrabold uppercase">
                        {c.mode === "solo" ? (
                          <User className="w-2.5 h-2.5" />
                        ) : (
                          <Users className="w-2.5 h-2.5" />
                        )}
                        <span>{c.mode}</span>
                      </span>
                      <span className="text-[10px] font-bold text-neu-muted">
                        {c.category} • {c.durationDays} Days
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-neu-dark truncate mt-1">
                      {c.title}
                    </h3>
                  </div>

                  {/* Right Column: Status Pill + Quit / Dismiss Action */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {isActive && (
                      <>
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 text-[10px] font-extrabold tabular-nums">
                          Day {c.dayNumber}/{c.durationDays} 🔥
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmTarget({
                              challengeId: c._id,
                              title: c.title,
                              type: "quit",
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neu-bg shadow-neu-flat-sm active:shadow-neu-pressed text-[10px] font-extrabold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                          <LogOut className="w-2.5 h-2.5" />
                          <span>Quit</span>
                        </button>
                      </>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-extrabold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Waiting</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmTarget({
                              challengeId: c._id,
                              title: c.title,
                              type: "cancel_invite",
                            })
                          }
                          title="Cancel Invite"
                          className="w-6 h-6 rounded-lg bg-neu-bg shadow-neu-flat-sm flex items-center justify-center text-neu-muted hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {(isCompleted || isFailed) && (
                      <div className="flex items-center gap-1.5">
                        {isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-extrabold flex items-center gap-1">
                            <Trophy className="w-2.5 h-2.5" />
                            <span>+{c.rewardValue} 🪙</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 text-[10px] font-extrabold flex items-center gap-1">
                            <XCircle className="w-2.5 h-2.5" />
                            <span>
                              {status === "expired" ? "Expired" : "Broken"}
                            </span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDismiss(c._id)}
                          title="Dismiss from history"
                          className="w-6 h-6 rounded-lg bg-neu-bg shadow-neu-flat-sm flex items-center justify-center text-neu-muted hover:text-neu-dark cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Horizontally Scrollable Day 1 -> End Date Matrix Row */}
                <HorizontalStreakRow
                  startDate={c.startDate}
                  durationDays={c.durationDays}
                  todayDate={todayDate}
                  isActive={isActive}
                  myCompletedDates={c.myCompletedDates ?? []}
                  allCompletedDates={c.allCompletedDates ?? []}
                  isMultiplayer={c.mode !== "solo"}
                  canCheckInToday={!c.myCheckedInToday && checkingId !== c._id}
                  onTapToday={() => handleCheckIn(c._id, c.title)}
                />

                {/* Card Footer: Squad Avatars + Action Button */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center -space-x-1.5">
                      {c.members.map((m) => (
                        <div
                          key={m.userId}
                          title={`${m.name}: ${
                            m.checkedInToday
                              ? "Done today ✅"
                              : "Pending today ⏳"
                          }`}
                          className="relative"
                        >
                          <UserAvatar
                            name={m.name}
                            avatarStorageId={m.avatarStorageId}
                            presetAvatarId={m.presetAvatarId}
                            size="sm"
                            className={
                              m.checkedInToday
                                ? "ring-2 ring-emerald-500"
                                : "opacity-80"
                            }
                          />
                          {isActive && (
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-neu-bg flex items-center justify-center ${
                                m.checkedInToday
                                  ? "bg-emerald-500 text-white"
                                  : "bg-amber-400"
                              }`}
                            >
                              {m.checkedInToday && (
                                <Check className="w-2 h-2 stroke-[3]" />
                              )}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <span className="text-[11px] font-bold text-neu-muted truncate">
                      {isPending
                        ? `${c.members.length}/${c.maxParticipants} joined`
                        : isActive
                          ? c.allCheckedInToday
                            ? "All done today!"
                            : `${
                                c.members.filter((m) => m.checkedInToday).length
                              }/${c.members.length} done today`
                          : isCompleted
                            ? "Jackpot Won!"
                            : status === "expired"
                              ? "Unaccepted (24h)"
                              : "Streak missed"}
                    </span>
                  </div>

                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleCopyInvite(c.inviteCode)}
                      className="px-3 py-1.5 rounded-xl bg-neu-bg shadow-neu-flat-sm active:shadow-neu-pressed text-[11px] font-extrabold text-neu-accent flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Invite</span>
                    </button>
                  )}

                  {isActive && (
                    <button
                      type="button"
                      disabled={c.myCheckedInToday || checkingId === c._id}
                      onClick={() => handleCheckIn(c._id, c.title)}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 shrink-0 transition-all ${
                        c.myCheckedInToday
                          ? "bg-emerald-500/15 text-emerald-600 cursor-default"
                          : "bg-neu-accent text-white shadow-neu-flat-sm active:scale-95 cursor-pointer"
                      }`}
                    >
                      {c.myCheckedInToday ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Done Today</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-3 h-3 text-amber-300" />
                          <span>
                            {checkingId === c._id ? "Saving..." : "Check In +5"}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </NeuCard>
            );
          })}
        </div>
      )}

      <CreateChallengeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        sessionToken={sessionToken}
      />

      <ConfirmActionModal
        isOpen={confirmTarget !== null}
        variant="danger"
        title={
          confirmTarget?.type === "quit"
            ? "Quit Active Challenge?"
            : "Cancel Challenge Invite?"
        }
        description={
          confirmTarget?.type === "quit"
            ? `Are you sure you want to quit "${confirmTarget.title}"? Your streak progress and completion jackpot eligibility for this challenge will be lost permanently.`
            : `Cancel the invite for "${confirmTarget?.title}"? The shareable invite link will expire immediately and your friend won't be able to join.`
        }
        confirmLabel={
          confirmTarget?.type === "quit"
            ? "Yes, Quit Challenge"
            : "Yes, Cancel Invite"
        }
        isLoading={isConfirming}
        onConfirm={handleConfirmLeaveOrCancel}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
};
