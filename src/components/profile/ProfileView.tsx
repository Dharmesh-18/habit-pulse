// src/components/profile/ProfileView.tsx
import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { NeuCard } from "../ui/NeuCard";
import { NeuButton } from "../ui/NeuButton";
import { NeuInput } from "../ui/NeuInput";
import { UserAvatar } from "../ui/UserAvatar";
import { useToast } from "../../context/ToastContext";
import { parseConvexError } from "../../lib/errorUtils";
import { Camera, ArrowLeft, Lock, Check } from "lucide-react";

interface ProfileViewProps {
  user: {
    id: string;
    email: string;
    name: string;
    avatarStorageId?: Id<"_storage">;
  };
  sessionToken: string;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  sessionToken,
  onBack,
}) => {
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const generateUploadUrl = useMutation(api.storage.index.generateUploadUrl);
  const updateProfile = useMutation(api.auth.index.updateProfile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      let newStorageId: Id<"_storage"> | undefined = undefined;

      // 1. If user picked a new picture, upload to Convex Storage
      if (selectedFile) {
        const postUrl = await generateUploadUrl({ sessionToken });
        const res = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        const uploadResult = await res.json();
        newStorageId = uploadResult.storageId;
      }

      // 2. Save profile changes
      await updateProfile({
        sessionToken,
        name: name.trim(),
        avatarStorageId: newStorageId,
      });

      toast.success("Profile updated successfully!");
      setSelectedFile(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <NeuButton size="sm" onClick={onBack} className="flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Habits</span>
        </NeuButton>
        <h2 className="text-base font-bold text-neu-dark">Account Settings</h2>
      </div>

      <NeuCard className="flex flex-col gap-6 p-8">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Avatar Upload Area */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {previewUrl ? (
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-neu-flat border-2 border-neu-accent">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <UserAvatar
                  name={name}
                  avatarStorageId={user.avatarStorageId}
                  size="xl"
                />
              )}

              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent hover:text-neu-dark cursor-pointer active:shadow-neu-pressed transition-all"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-neu-muted">Click camera icon to change profile photo</p>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            {/* Non-editable Email */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold text-neu-muted tracking-wide uppercase px-1 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-neu-muted" />
                <span>Email Address (Non-editable)</span>
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-neu-bg px-4 py-2.5 rounded-xl text-neu-muted text-sm shadow-neu-pressed cursor-not-allowed opacity-75 outline-none"
              />
            </div>

            {/* Editable Name */}
            <NeuInput
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <NeuButton
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="flex items-center gap-1.5 min-w-[120px] justify-center"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </NeuButton>
          </div>
        </form>
      </NeuCard>
    </div>
  );
};