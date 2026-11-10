// in src/components/habit/HabitCard.tsx
import React, { useState } from "react";
import { NeuCard } from "../ui/NeuCard";
import { NeuButton } from "../ui/NeuButton";
import { HeatmapGrid } from "./HeatmapGrid";
import { Check, Clock } from "lucide-react";
import { getTodayKey } from "../../lib/utils";
import { useToast } from "../../context/ToastContext";
import { parseConvexError } from "../../lib/errorUtils";
import { getCategoryMeta } from "../../lib/categories";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface HabitCardProps {
  habit: {
    _id: string;
    title: string;
    category: string;
    reminderTime?: string;
    version: number;
    customImageStorageId?: Id<"_storage">;
    logs: Record<string, boolean>;
  };
  onToggleToday: (id: string, date: string) => Promise<void>;
  onUpdate: (id: string, title: string, category: string, expectedVersion: number) => Promise<void>;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggleToday, onUpdate }) => {
  const toast = useToast();
  const todayKey = getTodayKey();
  const isDoneToday = habit.logs[todayKey] === true;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(habit.title);

  // Category Icon & Meta
  const catMeta = getCategoryMeta(habit.category);
  const CategoryIcon = catMeta.icon;

  // Convex Storage reactive query for custom uploaded icon/banner (if present)
  const customImageUrl = useQuery(
    api.storage.index.getImageUrl,
    habit.customImageStorageId ? { storageId: habit.customImageStorageId } : "skip"
  );

  const handleSaveNormal = async () => {
    try {
      await onUpdate(habit._id, editTitle, habit.category, habit.version);
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    }
  };

  const handleSimulateConflict = async () => {
    try {
      await onUpdate(habit._id, editTitle + " [Conflict]", habit.category, habit.version - 1);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    }
  };

  return (
    <NeuCard className="flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Tactile Checkbox */}
          <button
            onClick={() => onToggleToday(habit._id, todayKey)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 outline-none ${
              isDoneToday
                ? "bg-neu-accent text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                : "bg-neu-bg shadow-neu-flat active:shadow-neu-pressed text-transparent"
            }`}
          >
            <Check className="w-5 h-5 stroke-[3]" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neu-dark text-base tracking-tight">{habit.title}</h3>
              {customImageUrl && (
                <img
                  src={customImageUrl}
                  alt="Custom habit asset"
                  className="w-5 h-5 rounded-md object-cover shadow-neu-flat-sm"
                />
              )}
            </div>

            <div className="flex items-center gap-2.5 text-xs text-neu-muted mt-1.5">
              {/* Category Badge with SVG */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neu-bg shadow-neu-pressed-sm border border-black/5">
                <CategoryIcon className={`w-3.5 h-3.5 ${catMeta.color}`} />
                <span className="font-medium text-neu-dark text-[11px]">{catMeta.label}</span>
              </div>

              {habit.reminderTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {habit.reminderTime}
                </span>
              )}

              <span className="bg-neu-bg px-2 py-0.5 rounded-md shadow-neu-pressed-sm text-[10px] font-mono">
                v{habit.version}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NeuButton size="sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Close" : "Edit"}
          </NeuButton>
        </div>
      </div>

      {isEditing && (
        <div className="flex flex-col gap-3 p-3 rounded-xl bg-neu-bg shadow-neu-pressed-sm mt-2">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-neu-bg p-2 text-sm rounded-lg shadow-neu-pressed outline-none"
          />
          <div className="flex items-center justify-between">
            <NeuButton size="sm" variant="primary" onClick={handleSaveNormal}>
              Save Normal (v{habit.version})
            </NeuButton>
            <NeuButton
              size="sm"
              variant="danger"
              onClick={handleSimulateConflict}
              title="Sends stale version to test OCC rollback"
            >
              Test Conflict
            </NeuButton>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="mt-2">
        <HeatmapGrid logs={habit.logs} />
      </div>
    </NeuCard>
  );
};