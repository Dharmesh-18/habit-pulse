// src/components/challenges/CreateChallengeModal.tsx
import React, { useState } from "react";
import { useMutation } from "convex/react";
import {
  User,
  Users,
  ShieldAlert,
  Coins,
  Copy,
  Share2,
  Check,
  Flame
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { NeuModal } from "../ui/NeuModal";
import { NeuButton } from "../ui/NeuButton";
import { useToast } from "../../context/ToastContext";
import { parseConvexError } from "../../lib/errorUtils";

type ChallengeMode = "solo" | "duo" | "clan";

const MODES: {
  id: ChallengeMode;
  label: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
  mult: number;
}[] = [
  { id: "solo", label: "Solo", sub: "1 Player", icon: User, mult: 1.0 },
  { id: "duo", label: "Duo Buddy", sub: "2 Players", icon: Users, mult: 1.5 },
  { id: "clan", label: "Clan Squad", sub: "Up to 5", icon: Users, mult: 2.0 },
];

const DURATIONS = [
  { days: 7, baseMin: 40, baseMax: 70 },
  { days: 14, baseMin: 90, baseMax: 150 },
  { days: 21, baseMin: 160, baseMax: 250 },
  { days: 30, baseMin: 250, baseMax: 400 },
];

const CATEGORIES = ["Health", "Study", "Work", "Mindfulness", "Fitness"];

function getLocalTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  sessionToken,
}) => {
  const toast = useToast();
  const createMutation = useMutation(api.challenges.index.createChallenge);

  const [mode, setMode] = useState<ChallengeMode>("duo");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Health");
  const [durationDays, setDurationDays] = useState<number>(14);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Post-creation invite state for Duo / Clan
  const [createdInvite, setCreatedInvite] = useState<{
    inviteCode: string;
    title: string;
    mode: ChallengeMode;
    durationDays: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedModeObj = MODES.find((m) => m.id === mode)!;
  const selectedDurObj = DURATIONS.find((d) => d.days === durationDays)!;
  const minJackpot = Math.round(selectedDurObj.baseMin * selectedModeObj.mult);
  const maxJackpot = Math.round(selectedDurObj.baseMax * selectedModeObj.mult);

  const handleResetAndClose = () => {
    setCreatedInvite(null);
    setTitle("");
    setCopied(false);
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a challenge habit title.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createMutation({
        sessionToken,
        title: title.trim(),
        category,
        mode,
        durationDays,
        todayDate: getLocalTodayStr(),
      });

      if (res.status === "active") {
        toast.success(`🔥 Solo Challenge "${title.trim()}" started!`);
        handleResetAndClose();
      } else {
        setCreatedInvite({
          inviteCode: res.inviteCode,
          title: title.trim(),
          mode,
          durationDays,
        });
      }
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inviteUrl = createdInvite
    ? `${window.location.origin}/challenge/${createdInvite.inviteCode}`
    : "";

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!createdInvite) return;
    const text = encodeURIComponent(
      `🔥 Join my ${createdInvite.durationDays}-Day "${createdInvite.title}" ${
        createdInvite.mode === "duo" ? "Duo Buddy" : "Clan"
      } Challenge on Habit Pulse! No Streak Freeze allowed — complete it together to win ${minJackpot}–${maxJackpot} bonus coins!\n\nAccept within 24h: ${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <NeuModal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={createdInvite ? "Invite Your Squad 🔗" : "Start a Streak Challenge"}
    >
      {createdInvite ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="p-4 rounded-2xl bg-neu-bg shadow-neu-pressed-sm flex flex-col items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-extrabold uppercase tracking-wider">
              Expires in 24 Hours
            </span>
            <h4 className="text-base font-extrabold text-neu-dark">
              {createdInvite.title}
            </h4>
            <p className="text-xs text-neu-muted">
              {createdInvite.durationDays} Days •{" "}
              {createdInvite.mode === "duo" ? "Duo Buddy (2)" : "Clan (Up to 5)"}
            </p>
            <div className="mt-1 px-4 py-2 rounded-xl bg-neu-bg shadow-neu-flat-sm font-mono text-base font-extrabold tracking-widest text-neu-accent">
              {createdInvite.inviteCode}
            </div>
          </div>

          <p className="text-xs text-neu-muted leading-relaxed">
            The challenge starts the moment your friend accepts this link. If
            unaccepted for 24h, it automatically expires.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <NeuButton
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 font-bold"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </NeuButton>

            <NeuButton
              type="button"
              variant="primary"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 font-bold"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </NeuButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {/* Mode Selector: Solo | Duo | Clan */}
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`p-2.5 rounded-xl bg-neu-bg flex flex-col items-center gap-1 transition-all ${
                    active
                      ? "shadow-neu-pressed text-neu-accent ring-1 ring-neu-accent/40"
                      : "shadow-neu-flat-sm text-neu-muted hover:text-neu-dark"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-extrabold">{m.label}</span>
                  <span className="text-[10px] opacity-80">{m.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Habit Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neu-dark">
              Challenge Habit
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 6 AM Workout, No Sugar, 2h Deep Work"
              maxLength={60}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neu-bg shadow-neu-pressed-sm text-sm text-neu-dark placeholder:text-neu-muted/60 outline-none focus:ring-2 focus:ring-neu-accent/40"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  category === cat
                    ? "bg-neu-accent text-white shadow-sm"
                    : "bg-neu-bg shadow-neu-flat-sm text-neu-muted hover:text-neu-dark"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Duration Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neu-dark">
              Duration &amp; Completion Jackpot
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map((d) => {
                const active = durationDays === d.days;
                return (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => setDurationDays(d.days)}
                    className={`py-2 rounded-xl bg-neu-bg text-xs font-extrabold transition-all ${
                      active
                        ? "shadow-neu-pressed text-neu-accent ring-1 ring-neu-accent/40"
                        : "shadow-neu-flat-sm text-neu-dark"
                    }`}
                  >
                    {d.days} Days
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rules & Jackpot Summary Strip */}
          <div className="p-3 rounded-xl bg-neu-bg shadow-neu-pressed-sm flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center justify-between font-extrabold text-neu-dark">
              <span className="flex items-center gap-1.5 text-amber-500">
                <Coins className="w-3.5 h-3.5" />
                <span>Completion Jackpot</span>
              </span>
              <span className="tabular-nums">
                {minJackpot} – {maxJackpot} Coins each
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neu-muted font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>
                Strict Mode: No Streak Freeze allowed.{" "}
                {mode === "solo"
                  ? "Miss 1 day & challenge fails."
                  : "All members must check in daily."}
              </span>
            </div>
          </div>

          <NeuButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 font-extrabold py-2.5"
          >
            <Flame className="w-4 h-4" />
            <span>
              {isSubmitting
                ? "Creating..."
                : mode === "solo"
                  ? "Start Solo Challenge"
                  : "Create & Get Invite Link"}
            </span>
          </NeuButton>
        </form>
      )}
    </NeuModal>
  );
};