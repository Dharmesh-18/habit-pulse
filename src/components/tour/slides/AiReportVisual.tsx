// src/components/tour/slides/AiReportVisual.tsx
import React, { useEffect, useState } from "react";
import { Sparkles, Coins, FileText, Loader2 } from "lucide-react";

export const AiReportVisual: React.FC = () => {
  // 0: Ready CTA | 1: Tapped + "-50" Coin Pop | 2: Generating | 3: Layered Checkmark Document Revealed
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % 4);
    }, 1350);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-xs mx-auto p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
      {stage < 3 ? (
        <div className="h-[136px] flex flex-col items-center justify-center gap-3 px-3 rounded-xl bg-neu-bg shadow-neu-flat-sm border border-neu-accent/15">
          <div className="flex items-center gap-1.5 text-neu-dark">
            <Sparkles className="w-4 h-4 text-neu-accent" />
            <span className="text-xs font-extrabold">
              AI Pulse Coach Report
            </span>
          </div>

          {/* CTA Button with Floating "-50 Coin" Pop */}
          <div className="relative inline-flex items-center">
            <div
              className={`px-3.5 py-2 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition-all duration-300 ${
                stage === 1
                  ? "bg-neu-accent text-white scale-95 shadow-inner"
                  : stage === 2
                    ? "bg-neu-accent/85 text-white"
                    : "bg-neu-accent text-white shadow-neu-flat-sm"
              }`}
            >
              {stage === 2 ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate Report • 50</span>
                  <Coins className="w-3.5 h-3.5 text-amber-300" />
                </>
              )}
            </div>

            {/* Floating Coin Deduction Pop right beside the button */}
            {stage === 1 && (
              <span className="absolute -top-3.5 -right-5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold shadow flex items-center gap-0.5 animate-bounce pointer-events-none">
                <span>-50</span>
                <Coins className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          <span className="text-[10px] font-semibold text-neu-muted">
            {stage === 1
              ? "50 Coins redeemed • Building insights..."
              : "Weekly & monthly habit breakdown"}
          </span>
        </div>
      ) : (
        /* Stage 3: Clean Animated Layered Document + Circular Checkmark Badge */
        <div className="h-[136px] flex flex-col items-center justify-center gap-2 px-3 rounded-xl bg-neu-bg shadow-neu-flat-sm border border-emerald-500/20 animate-[fadeIn_0.25s_ease-out]">
          <svg
            viewBox="0 0 88 84"
            className="w-16 h-16 overflow-visible text-neu-dark"
            fill="none"
          >
            {/* Back Stacked Sheet */}
            <path
              d="M20 22 H52 V68 H20 Z"
              className="fill-neu-bg stroke-current"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Front Sheet with Folded Top-Right Corner */}
            <path
              d="M27 14 H52 L63 25 V61 H27 Z"
              className="fill-neu-bg stroke-current"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Corner Fold Crease */}
            <path
              d="M52 14 V25 H63"
              className="stroke-current"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 3 Summary Text Lines */}
            <line
              x1="34"
              y1="25"
              x2="45"
              y2="25"
              className="stroke-current"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="34"
              y1="32"
              x2="53"
              y2="32"
              className="stroke-current"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="34"
              y1="39"
              x2="43"
              y2="39"
              className="stroke-current"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* 2 Mini Checklist Ticks on Left */}
            <path
              d="M34 47 L36.5 49.5 L41 45"
              className="stroke-neu-accent"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M34 54.5 L36.5 57 L41 52.5"
              className="stroke-neu-accent"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Circular Checkmark Badge on Bottom-Right */}
            <circle
              cx="62"
              cy="53"
              r="14"
              className="fill-neu-bg stroke-emerald-500"
              strokeWidth="3.2"
            />
            <path
              d="M56.5 53 L60.5 57 L68 49"
              className="stroke-emerald-500"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="flex flex-col items-center text-center leading-tight">
            <span className="text-[11px] font-extrabold text-emerald-600">
              AI Dossier Ready!
            </span>
            <span className="text-[9px] font-semibold text-neu-muted mt-0.5">
              Personalized weekly &amp; monthly report
            </span>
          </div>
        </div>
      )}
    </div>
  );
};