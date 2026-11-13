// src/components/habit/CreateHabitCard.tsx
import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { NeuCard } from "../ui/NeuCard";
import { NeuInput } from "../ui/NeuInput";
import { NeuButton } from "../ui/NeuButton";
import { NeuCategorySelect } from "../ui/NeuCategorySelect";
import { PlusCircle, ImagePlus } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { parseConvexError } from "../../lib/errorUtils";

interface CreateHabitCardProps {
  sessionToken: string;
}

export const CreateHabitCard: React.FC<CreateHabitCardProps> = ({
  sessionToken,
}) => {
  const toast = useToast();
  const [habitTitle, setHabitTitle] = useState("");
  const [category, setCategory] = useState("Health");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createHabitMutation = useMutation(api.habits.index.create);
  const generateUploadUrlMutation = useMutation(
    api.storage.index.generateUploadUrl
  );

  const uploadToConvexStorage = async (file: File): Promise<Id<"_storage">> => {
    const postUrl = await generateUploadUrlMutation({ sessionToken });
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    return storageId;
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentName = habitTitle.trim();
    if (!currentName) return;

    try {
      setIsUploading(true);
      let customImageStorageId: Id<"_storage"> | undefined = undefined;

      if (selectedFile) {
        customImageStorageId = await uploadToConvexStorage(selectedFile);
      }

      await createHabitMutation({
        sessionToken,
        title: currentName,
        category,
        reminderTime,
        timezoneOffset: new Date().getTimezoneOffset(),
        customImageStorageId,
      });

      toast.success(`Habit "${currentName}" created!`);
      setHabitTitle("");
      setSelectedFile(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <NeuCard className="relative z-20 overflow-visible">
      <form onSubmit={handleCreateHabit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <div className="md:col-span-4">
            <NeuInput
              label="New Habit Name"
              placeholder="e.g. 50 Weighted Pullups"
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-3">
            <NeuCategorySelect value={category} onChange={setCategory} />
          </div>

          <div className="md:col-span-3">
            <NeuInput
              label="Reminder"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <NeuButton
              type="submit"
              variant="primary"
              disabled={isUploading}
              className="flex items-center justify-center gap-1.5 w-full h-[42px]"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{isUploading ? "Saving..." : "Add"}</span>
            </NeuButton>
          </div>
        </div>

        {/* Habit Attachment Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs text-neu-muted">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-neu-dark font-medium px-2.5 py-1.5 rounded-xl bg-neu-bg shadow-neu-flat-sm active:shadow-neu-pressed transition-all">
              <ImagePlus className="w-3.5 h-3.5 text-neu-accent shrink-0" />
              <span className="truncate max-w-[240px]">
                {selectedFile
                  ? selectedFile.name
                  : "Attach icon / image (Optional)"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                  e.target.value = "";
                }}
              />
            </label>

            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-[11px] font-medium text-neu-danger hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </form>
    </NeuCard>
  );
};