import React, { useState } from "react";
import { NeuCard } from "../ui/NeuCard";
import { NeuButton } from "../ui/NeuButton";
import { HeatmapGrid } from "./HeatmapGrid";
import { Check, Clock, Trash2, AlertCircle, Target } from "lucide-react";
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
  onUpdate: (
    id: string,
    title: string,
    category: string,
    expectedVersion: number,
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onToggleToday,
  onUpdate,
  onDelete,
}) => {
  const toast = useToast();
  const todayKey = getTodayKey();
  const isDoneToday = habit.logs[todayKey] === true;
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(habit.title);

  const catMeta = getCategoryMeta(habit.category);
  const CategoryIcon = catMeta.icon;

  const customImageUrl = useQuery(
    api.storage.index.getImageUrl,
    habit.customImageStorageId
      ? { storageId: habit.customImageStorageId }
      : "skip",
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
      await onUpdate(
        habit._id,
        editTitle + " [Conflict]",
        habit.category,
        habit.version - 1,
      );
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(habit._id);
      setShowDeleteConfirm(false);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
      setIsDeleting(false);
    }
  };

  return (
    <NeuCard className="flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Tactile Checkbox */}
          {/* Tactile Completion Toggle Button */}
          <button
            type="button"
            onClick={() => onToggleToday(habit._id, todayKey)}
            title={
              isDoneToday
                ? "Completed today (Click to uncheck)"
                : "Mark as done for today"
            }
            className={`group w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 outline-none select-none ${
              isDoneToday
                ? "bg-neu-accent text-white shadow-[0_0_12px_rgba(79,70,229,0.4)] scale-100"
                : "bg-neu-bg shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed text-neu-muted/40 hover:text-neu-accent"
            }`}
          >
            {isDoneToday ? (
              <Check className="w-5 h-5 stroke-[3] animate-in zoom-in-75 duration-200" />
            ) : (
              <Target className="w-4 h-4 stroke-[2] stroke-dashed transition-transform group-hover:scale-110" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neu-dark text-base tracking-tight">
                {habit.title}
              </h3>
              {customImageUrl && (
                <img
                  src={customImageUrl}
                  alt="Custom habit asset"
                  className="w-5 h-5 rounded-md object-cover shadow-neu-flat-sm"
                />
              )}
            </div>

            <div className="flex items-center gap-2.5 text-xs text-neu-muted mt-1.5">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neu-bg shadow-neu-pressed-sm border border-black/5">
                <CategoryIcon className={`w-3.5 h-3.5 ${catMeta.color}`} />
                <span className="font-medium text-neu-dark text-[11px]">
                  {catMeta.label}
                </span>
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

        {/* Action Buttons Column: Edit on top, Trash below */}
        <div className="flex flex-col items-center gap-2">
          <NeuButton
            size="sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? "Close" : "Edit"}
          </NeuButton>

          <button
            type="button"
            title="Delete Habit"
            onClick={() => {
              setIsEditing(false);
              setShowDeleteConfirm(!showDeleteConfirm);
            }}
            className="w-8 h-8 bg-red-100 rounded-xl bg-neu-bg shadow-neu-flat hover:shadow-neu-flat-lg active:shadow-neu-pressed flex items-center justify-center text-neu-muted hover:text-neu-danger transition-all duration-200"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
      </div>

      {/* Confirmation Popup for Delete */}
      {showDeleteConfirm && (
        <div className="p-4 rounded-xl bg-neu-bg shadow-neu-pressed-sm border border-neu-danger/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs text-neu-danger font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Are you sure you want to delete "{habit.title}"?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NeuButton
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </NeuButton>
            <NeuButton
              size="sm"
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </NeuButton>
          </div>
        </div>
      )}

      {/* Inline Edit Panel */}
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

      {/* Heatmap Grid */}
      <div className="mt-2">
        <HeatmapGrid logs={habit.logs} />
      </div>
    </NeuCard>
  );
};
