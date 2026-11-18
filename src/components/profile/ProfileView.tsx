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
import { cn } from "../../lib/utils";
import { ConfirmActionModal } from "../ui/ConfirmActionModal";
import { BellRing } from "lucide-react";
import { usePushNotifications } from "../../hooks/usePushNotifications";

interface ProfileViewProps {
  user: {
    id: string;
    email: string;
    name: string;
    avatarStorageId?: Id<"_storage">;
    notificationsEnabled?: boolean;
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

  const updateNotificationPref = useMutation(
    api.auth.index.updateNotificationPreference,
  );

  const isNotificationsEnabled = user.notificationsEnabled ?? true;
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
  const [isUpdatingPref, setIsUpdatingPref] = useState(false);

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isEnabled: isPushEnabled,
    isLoading: isPushLoading,
    enablePush,
    disablePush,
  } = usePushNotifications(sessionToken);

  const handleTogglePush = async () => {
    try {
      if (isPushEnabled) {
        await disablePush();
        toast.info("Device push notifications disabled");
      } else {
        await enablePush();
        toast.success("Device push notifications enabled!");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not update push settings",
      );
    }
  };

  const handleConfirmToggle = async () => {
    if (pendingToggle === null) return;
    try {
      setIsUpdatingPref(true);
      await updateNotificationPref({
        sessionToken,
        enabled: pendingToggle,
      });
      toast.success(
        pendingToggle
          ? "Notifications turned ON."
          : "Notifications turned OFF.",
      );
      setPendingToggle(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsUpdatingPref(false);
    }
  };

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
        <NeuButton
          size="sm"
          onClick={onBack}
          className="flex items-center gap-1.5"
        >
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
            <p className="text-xs text-neu-muted">
              Click camera icon to change profile photo
            </p>
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
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-black/5">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={isNotificationsEnabled}
                onClick={() => setPendingToggle(!isNotificationsEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-all duration-200 shadow-neu-pressed-sm focus:outline-none",
                  isNotificationsEnabled ? "bg-neu-accent/25" : "bg-neu-bg",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-neu-flat-sm transition-transform duration-200",
                    isNotificationsEnabled
                      ? "translate-x-5 bg-neu-accent"
                      : "translate-x-0 bg-neu-muted/60",
                  )}
                />
              </button>
              <span className="text-xs font-semibold text-neu-dark select-none">
                Notifications {isNotificationsEnabled ? "On" : "Off"}
              </span>
            </div>

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

          {/* Device Push Notifications Card */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-neu-bg shadow-neu-pressed-sm">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent shrink-0 mt-0.5">
                <BellRing className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-neu-dark">
                  Device Push Notifications
                </p>
                <p className="text-xs text-neu-muted mt-0.5 leading-relaxed">
                  {!isPushSupported
                    ? "On iPhone/iPad, tap Share → Add to Home Screen first to enable push reminders."
                    : pushPermission === "denied"
                      ? "Blocked in browser settings. Enable notifications for this site to receive alerts."
                      : "Receive native lock-screen reminders on this device even when the app is closed."}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isPushEnabled}
              disabled={!isPushSupported || isPushLoading}
              onClick={handleTogglePush}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 p-1 shadow-neu-pressed-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                isPushEnabled ? "bg-neu-accent" : "bg-neu-bg"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  isPushEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </form>
      </NeuCard>

      <ConfirmActionModal
        isOpen={pendingToggle !== null}
        isTurningOff={pendingToggle === false}
        variant={pendingToggle === false ? "danger" : "primary"}
        title={
          pendingToggle === false
            ? "Turn off notifications?"
            : "Turn on notifications?"
        }
        description={
          pendingToggle === false
            ? "Do you want to stop receiving notifications from Habit Pulse? You won't receive habit creation alerts or daily reminders until you turn this back on."
            : "Do you want to start receiving notifications from Habit Pulse again?"
        }
        confirmLabel={
          pendingToggle === false ? "Yes, Turn Off" : "Yes, Turn On"
        }
        isLoading={isUpdatingPref}
        onConfirm={handleConfirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
};
