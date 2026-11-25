// src/components/tour/FeatureTourModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import { NeuModal } from "../ui/NeuModal";
import { NeuButton } from "../ui/NeuButton";
import { TOUR_SLIDES } from "./tourSlides";

interface FeatureTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureTourModal: React.FC<FeatureTourModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset to first slide whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const totalSlides = TOUR_SLIDES.length;
  const slide = TOUR_SLIDES[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSlides - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onClose();
    } else {
      setCurrentIndex((i) => Math.min(totalSlides - 1, i + 1));
    }
  }, [isLast, onClose, totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // Keyboard Left / Right arrow support
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleNext, handlePrev]);

  if (!slide) return null;
  const Icon = slide.icon;
  const VisualComponent = slide.Visual;

  return (
    <NeuModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Feature Tour (${currentIndex + 1}/${totalSlides})`}
    >
      <div className="flex flex-col gap-5">
        {/* Category Pill & Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neu-bg shadow-neu-flat-sm text-[11px] font-extrabold uppercase tracking-wider ${slide.accentColor}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{slide.badge}</span>
          </span>

          <h3 className="text-base sm:text-lg font-extrabold text-neu-dark leading-snug mt-1">
            {slide.title}
          </h3>

          <p className="text-xs sm:text-[13px] text-neu-muted leading-relaxed max-w-sm">
            {slide.description}
          </p>
        </div>

        {/* Live Animated Feature Stage */}
        <div className="py-2 flex items-center justify-center min-h-[156px]">
          <VisualComponent />
        </div>

        {/* Clickable Slide Indicator Dots */}
        <div className="flex items-center justify-center gap-2">
          {TOUR_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}: ${s.title}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-6 bg-neu-accent shadow-[0_0_8px_rgba(79,70,229,0.45)]"
                  : "w-2 bg-black/15 hover:bg-black/30"
              }`}
            />
          ))}
        </div>

        {/* Bottom Prev / Skip / Next Navigation */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/5">
          <NeuButton
            type="button"
            size="sm"
            disabled={isFirst}
            onClick={handlePrev}
            className="flex items-center gap-1 font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </NeuButton>

          {!isLast && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-neu-muted hover:text-neu-dark transition-colors px-2 py-1"
            >
              Skip Tour
            </button>
          )}

          <NeuButton
            type="button"
            size="sm"
            variant="primary"
            onClick={handleNext}
            className="flex items-center gap-1.5 font-bold"
          >
            {isLast ? (
              <>
                <Rocket className="w-3.5 h-3.5" />
                <span>Start Tracking</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </NeuButton>
        </div>
      </div>
    </NeuModal>
  );
};