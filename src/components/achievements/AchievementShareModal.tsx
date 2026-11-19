// src/components/achievements/AchievementShareModal.tsx
import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { X, Share2, Download, Flame, Sparkles } from "lucide-react";
import { BadgeArtwork } from "./BadgeArtwork";
import { getMilestoneMeta } from "../../lib/achievements";
import { getCategoryMeta } from "../../lib/categories";
import { NeuButton } from "../ui/NeuButton";
import { useToast } from "../../context/ToastContext";

export interface SelectedAchievement {
  habitTitle: string;
  category: string;
  milestone: number;
  unlockedAt: number;
  userName?: string;
}

interface AchievementShareModalProps {
  achievement: SelectedAchievement | null;
  onClose: () => void;
}

export const AchievementShareModal: React.FC<AchievementShareModalProps> = ({
  achievement,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  if (!achievement) return null;

  const meta = getMilestoneMeta(achievement.milestone);
  const catMeta = getCategoryMeta(achievement.category);
  const unlockedDateLabel = new Date(achievement.unlockedAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  const appUrl =
  typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://habit-pulse-d18.netlify.app";

  const generatePngFile = async (): Promise<{
    dataUrl: string;
    file: File;
  }> => {
    if (!cardRef.current) throw new Error("Card not ready");
    const dataUrl = await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2.5,
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fileName = `habit-pulse-${achievement.milestone}-day-streak.png`;
    const file = new File([blob], fileName, { type: "image/png" });
    return { dataUrl, file };
  };

  const triggerDownload = (dataUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  };

  const handleShare = async () => {
    try {
      setIsExporting(true);
      const { dataUrl, file } = await generatePngFile();

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${meta.title} — Habit Pulse`,
          text: `🔥 I just hit a ${achievement.milestone}-day streak on "${achievement.habitTitle}" using Habit Pulse! Start your streaks on ${appUrl}`,
          files: [file],
        });
      } else {
        triggerDownload(dataUrl, file.name);
        toast.success("Achievement card saved as PNG!");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Could not generate share card");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadOnly = async () => {
    try {
      setIsExporting(true);
      const { dataUrl, file } = await generatePngFile();
      triggerDownload(dataUrl, file.name);
      toast.success("Badge card downloaded!");
    } catch {
      toast.error("Failed to download image");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-neu-bg p-5 shadow-neu-flat flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-neu-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neu-accent" />
            Achievement Unlocked
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-xl bg-neu-bg shadow-neu-flat active:shadow-neu-pressed flex items-center justify-center text-neu-muted hover:text-neu-dark"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* EXPORTABLE PNG POSTER CARD */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl p-6 text-white flex flex-col items-center text-center gap-4"
          style={{
            background:
              "linear-gradient(145deg, #0F172A 0%, #1E1B4B 55%, #111827 100%)",
          }}
        >
          {/* Ambient glow behind badge */}
          <div
            className="absolute -top-12 w-48 h-48 rounded-full blur-3xl opacity-50 pointer-events-none"
            style={{ backgroundColor: meta.primaryColor }}
          />

          {/* Brand Header */}
          <div className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-extrabold tracking-wider uppercase">
              Habit Pulse
            </span>
          </div>

          {/* Large Medallion */}
          <div className="relative my-1">
            <BadgeArtwork
              milestone={achievement.milestone}
              unlocked
              size="lg"
            />
          </div>

          {/* Achievement Copy */}
          <div className="relative space-y-1">
            <p
              className="text-xs font-extrabold uppercase tracking-widest"
              style={{ color: meta.secondaryColor }}
            >
              {meta.title}
            </p>
            <h3 className="text-xl font-black tracking-tight leading-snug">
              {achievement.habitTitle}
            </h3>
            <p className="text-xs text-slate-300">
              Completed{" "}
              <span className="font-bold text-white">
                {achievement.milestone}{" "}
                {achievement.milestone === 1 ? "day" : "days"}
              </span>{" "}
              unbroken streak • {catMeta.label}
            </p>
          </div>

          {/* Footer Strip */}
          <div className="relative w-full pt-3 mt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span>Unlocked {unlockedDateLabel}</span>
            <span className="font-semibold text-slate-300">
              habit-pulse-d18.netlify.app
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <NeuButton
            type="button"
            onClick={handleDownloadOnly}
            disabled={isExporting}
            className="flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-neu-accent" />
            <span>Save PNG</span>
          </NeuButton>

          <NeuButton
            type="button"
            variant="primary"
            onClick={handleShare}
            disabled={isExporting}
            className="flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>{isExporting ? "Preparing..." : "Share"}</span>
          </NeuButton>
        </div>
      </div>
    </div>
  );
};
