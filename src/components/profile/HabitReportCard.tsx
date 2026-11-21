// src/components/profile/HabitReportCard.tsx
import React, { useState } from "react";
import { useAction, useQuery } from "convex/react";
import {
  FileDown,
  Sparkles,
  CalendarDays,
  Loader2,
  Coins,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { NeuButton } from "../ui/NeuButton";
import { buildAndDownloadHabitReportPdf } from "../../lib/pdfReportBuilder";
import { useToast } from "../../context/ToastContext";
import { parseConvexError } from "../../lib/errorUtils";

interface HabitReportCardProps {
  sessionToken: string;
}

const REPORT_COSTS: Record<"week" | "month", number> = {
  week: 10,
  month: 25,
};

export const HabitReportCard: React.FC<HabitReportCardProps> = ({
  sessionToken,
}) => {
  const toast = useToast();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [isGenerating, setIsGenerating] = useState(false);

  const wallet = useQuery(api.shop.index.getMyWallet, { sessionToken });
  const generateHabitReport = useAction(api.reports.index.generateHabitReport);

  const currentCoins = wallet?.coins ?? 0;
  const selectedCost = REPORT_COSTS[period];

  const handleGeneratePdf = async () => {
    // Immediate client-side check before invoking backend action
    if (currentCoins < selectedCost) {
      toast.error(
        `Not enough coins! You need ${selectedCost} Coins (you have ${currentCoins}). Complete habits or top up in the Shop.`
      );
      return;
    }

    try {
      setIsGenerating(true);
      const report = await generateHabitReport({
        sessionToken,
        period,
      });

      const fileName = await buildAndDownloadHabitReportPdf(report);
      toast.success(
        `Downloaded "${fileName}" (-${report.coinsSpent} Coins)`
      );
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-neu-bg shadow-neu-flat-sm flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-center text-neu-accent shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-neu-dark">
                Pulse Coach AI Report (PDF)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-neu-accent/15 text-neu-accent">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-neu-muted mt-0.5 leading-relaxed">
              Generate a gamified streak dossier with personalized Pulse Coach
              AI insights to level up your consistency.
            </p>
          </div>
        </div>

        {/* Live Coin Balance Pill */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neu-bg shadow-neu-pressed-sm text-xs font-extrabold text-neu-dark shrink-0 tabular-nums">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span>{currentCoins.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segmented Period Selector with Coin Price Badges */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-neu-bg shadow-neu-pressed-sm">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setPeriod("week")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              period === "week"
                ? "bg-neu-bg text-neu-accent shadow-neu-flat-sm"
                : "text-neu-muted hover:text-neu-dark"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>Last Week</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 text-[10px] font-extrabold tabular-nums">
              <Coins className="w-2.5 h-2.5" />
              10
            </span>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => setPeriod("month")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              period === "month"
                ? "bg-neu-bg text-neu-accent shadow-neu-flat-sm"
                : "text-neu-muted hover:text-neu-dark"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span>Last Month</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 text-[10px] font-extrabold tabular-nums">
              <Coins className="w-2.5 h-2.5" />
              25
            </span>
          </button>
        </div>

        <NeuButton
          type="button"
          variant="primary"
          size="sm"
          disabled={isGenerating}
          onClick={handleGeneratePdf}
          className="flex items-center justify-center gap-2 font-bold px-4 py-2.5 tabular-nums"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Dossier...</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              <span>Generate ({selectedCost} Coins)</span>
            </>
          )}
        </NeuButton>
      </div>
    </div>
  );
};