// src/components/habit/HabitMatrix.tsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { NeuCard } from "../ui/NeuCard";
import { NeuButton } from "../ui/NeuButton";
import { NeuInput } from "../ui/NeuInput";
import { NeuCategorySelect } from "../ui/NeuCategorySelect";
import { NeuModal } from "../ui/NeuModal";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { cn, getDaysInMonth } from "../../lib/utils";
import { getCategoryMeta } from "../../lib/categories";
import { useToast } from "../../context/ToastContext";
import { parseConvexError } from "../../lib/errorUtils";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export interface HabitItem {
  _id: string;
  _creationTime?: number;
  createdAt?: number;
  title: string;
  category: string;
  reminderTime?: string;
  version: number;
  customImageStorageId?: Id<"_storage">;
  logs: Record<string, boolean>;
}

interface HabitMatrixProps {
  habits: HabitItem[];
  onToggleDate: (habitId: string, date: string) => Promise<void>;
  onUpdate: (
    habitId: string,
    title: string,
    category: string,
    expectedVersion: number
  ) => Promise<void>;
  onDelete: (habitId: string) => Promise<void>;
}

const HabitThumbnail: React.FC<{ storageId?: Id<"_storage"> }> = ({ storageId }) => {
  const url = useQuery(
    api.storage.index.getImageUrl,
    storageId ? { storageId } : "skip"
  );
  if (!url) return null;
  return (
    <img
      src={url}
      alt="Habit icon"
      className="w-5 h-5 rounded-md object-cover shadow-neu-flat-sm shrink-0"
    />
  );
};

export const HabitMatrix: React.FC<HabitMatrixProps> = ({
  habits,
  onToggleDate,
  onUpdate,
  onDelete,
}) => {
  const toast = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // Modal States (holding the active habit object)
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Health");
  const [isSaving, setIsSaving] = useState(false);

  const [deletingHabit, setDeletingHabit] = useState<HabitItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const days = useMemo(
    () => getDaysInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const monthYearLabel = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const todayEl = container.querySelector('[data-today="true"]') as HTMLElement;
    if (todayEl) {
      const offset = todayEl.offsetLeft - container.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
    }
  }, [selectedMonth, selectedYear, habits.length]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const d = new Date();
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth());
  };

  const openEditModal = (habit: HabitItem) => {
    setDeletingHabit(null);
    setEditingHabit(habit);
    setEditTitle(habit.title);
    setEditCategory(habit.category);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !editTitle.trim()) return;
    try {
      setIsSaving(true);
      await onUpdate(
        editingHabit._id,
        editTitle.trim(),
        editCategory,
        editingHabit.version
      );
      setEditingHabit(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateConflict = async () => {
    if (!editingHabit) return;
    try {
      await onUpdate(
        editingHabit._id,
        editTitle.trim() + " [Conflict]",
        editCategory,
        editingHabit.version - 1
      );
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingHabit) return;
    try {
      setIsDeleting(true);
      await onDelete(deletingHabit._id);
      setDeletingHabit(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <NeuCard className="p-0 overflow-hidden flex flex-col">
        {/* Top Grid Header: Month & Year Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-black/5 bg-neu-bg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-center text-neu-accent">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neu-dark tracking-tight">
                {monthYearLabel}
              </h2>
              <p className="text-[11px] text-neu-muted">
                Click today&apos;s cell to log progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NeuButton size="sm" onClick={handleJumpToday}>
              Today
            </NeuButton>
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="w-8 h-8 rounded-xl bg-neu-bg shadow-neu-flat active:shadow-neu-pressed flex items-center justify-center text-neu-text hover:text-neu-accent transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="w-8 h-8 rounded-xl bg-neu-bg shadow-neu-flat active:shadow-neu-pressed flex items-center justify-center text-neu-text hover:text-neu-accent transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Matrix Table */}
        <div ref={scrollContainerRef} className="overflow-x-auto relative">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black/5">
                <th className="sticky left-0 z-20 bg-neu-bg px-5 py-3 min-w-[230px] max-w-[260px] text-xs font-bold uppercase tracking-wider text-neu-muted shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                  Habit
                </th>

                {days.map((day) => (
                  <th
                    key={day.dateStr}
                    data-today={day.isToday ? "true" : undefined}
                    className={cn(
                      "px-1.5 py-2.5 text-center min-w-[42px] select-none transition-colors",
                      day.isToday && "bg-neu-accent/5"
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-medium text-neu-muted">
                        {day.weekday}
                      </span>
                      <span
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                          day.isToday
                            ? "bg-neu-accent text-white shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                            : "text-neu-dark"
                        )}
                      >
                        {day.dayNumber}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {habits.map((habit) => {
                const catMeta = getCategoryMeta(habit.category);
                const CategoryIcon = catMeta.icon;

                return (
                  <tr
                    key={habit._id}
                    className="group hover:bg-black/[0.015] transition-colors"
                  >
                    {/* Sticky Habit Info Cell */}
                    <td className="sticky left-0 z-10 bg-neu-bg px-5 py-3 min-w-[230px] max-w-[260px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            title={catMeta.label}
                            className="w-8 h-8 rounded-xl bg-neu-bg shadow-neu-pressed-sm flex items-center justify-center shrink-0"
                          >
                            <CategoryIcon className={cn("w-4 h-4", catMeta.color)} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                title={habit.title}
                                className="font-semibold text-sm text-neu-dark truncate"
                              >
                                {habit.title}
                              </span>
                              <HabitThumbnail storageId={habit.customImageStorageId} />
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-neu-muted mt-0.5">
                              {habit.reminderTime && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {habit.reminderTime}
                                </span>
                              )}
                              <span className="font-mono opacity-75">v{habit.version}</span>
                            </div>
                          </div>
                        </div>

                        {/* Row Quick Actions -> Open Centered Modals */}
                        <div className="flex items-center gap-1 shrink-0 opacity-75 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Edit Habit"
                            onClick={() => openEditModal(habit)}
                            className="p-1.5 rounded-lg bg-neu-bg shadow-neu-flat-sm active:shadow-neu-pressed text-neu-muted hover:text-neu-accent transition-all"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Delete Habit"
                            onClick={() => setDeletingHabit(habit)}
                            className="p-1.5 rounded-lg bg-neu-bg shadow-neu-flat-sm active:shadow-neu-pressed text-neu-muted hover:text-neu-danger transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Date Grid Cells */}
                    {days.map((day) => {
                      const isDone = habit.logs[day.dateStr] === true;
                      return (
                        <td
                          key={day.dateStr}
                          className={cn(
                            "px-1.5 py-2.5 text-center",
                            day.isToday && "bg-neu-accent/5"
                          )}
                        >
                          <button
                            disabled={!day.isToday}
                            type="button"
                            onClick={() => onToggleDate(habit._id, day.dateStr)}
                            title={
                              day.isToday
                                ? `${habit.title} — Today: ${
                                    isDone ? "Completed" : "Mark Done"
                                  }`
                                : `${habit.title} — ${day.dateStr} (${
                                    isDone ? "Completed" : "Locked"
                                  })`
                            }
                            className={cn(
                              "w-7 h-7 rounded-lg mx-auto flex items-center justify-center transition-all duration-200 outline-none",
                              !day.isToday && "opacity-50 cursor-not-allowed",
                              isDone
                                ? "bg-neu-accent text-white shadow-[0_0_8px_rgba(79,70,229,0.45)] scale-105"
                                : cn(
                                    "bg-neu-bg shadow-neu-pressed-sm text-transparent",
                                    day.isToday &&
                                      "hover:shadow-neu-flat-sm hover:text-neu-accent/40"
                                  )
                            )}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {/* 1. Centered Edit Modal */}
      <NeuModal
        isOpen={Boolean(editingHabit)}
        onClose={() => setEditingHabit(null)}
        title={`Edit Habit (v${editingHabit?.version ?? 1})`}
      >
        {editingHabit && (
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
            <NeuInput
              label="Habit Name"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Habit title"
              required
            />

            <NeuCategorySelect
              label="Category"
              value={editCategory}
              onChange={(cat) => setEditCategory(cat)}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/5">
              <NeuButton
                type="button"
                size="sm"
                variant="danger"
                onClick={handleSimulateConflict}
                title="Sends stale version to test OCC rollback"
              >
                Test Conflict
              </NeuButton>

              <div className="flex items-center gap-2">
                <NeuButton
                  type="button"
                  size="sm"
                  onClick={() => setEditingHabit(null)}
                >
                  Cancel
                </NeuButton>
                <NeuButton
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </NeuButton>
              </div>
            </div>
          </form>
        )}
      </NeuModal>

      {/* 2. Centered Delete Confirmation Modal */}
      <NeuModal
        isOpen={Boolean(deletingHabit)}
        onClose={() => setDeletingHabit(null)}
        title="Delete Habit"
      >
        {deletingHabit && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neu-bg shadow-neu-pressed-sm border border-neu-danger/20">
              <div className="w-9 h-9 rounded-xl bg-neu-danger/10 text-neu-danger flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs leading-relaxed text-neu-text">
                Are you sure you want to delete{" "}
                <span className="font-bold text-neu-dark">
                  &quot;{deletingHabit.title}&quot;
                </span>
                ? This will remove it from your active matrix tracker.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <NeuButton
                type="button"
                size="sm"
                onClick={() => setDeletingHabit(null)}
                disabled={isDeleting}
              >
                Cancel
              </NeuButton>
              <NeuButton
                type="button"
                size="sm"
                variant="danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </NeuButton>
            </div>
          </div>
        )}
      </NeuModal>
    </>
  );
};