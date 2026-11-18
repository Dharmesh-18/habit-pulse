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
import { Camera, ArrowLeft, Lock, Check, BellRing, Mail, Share2 } from "lucide-react";
import { ConfirmActionModal } from "../ui/ConfirmActionModal";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { SettingToggleCard } from "../ui/SettingToggleCard";

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
          ? "Email reminders turned ON."
          : "Email reminders turned OFF.",
      );
      setPendingToggle(null);
    } catch (err: unknown) {
      toast.error(parseConvexError(err));
    } finally {
      setIsUpdatingPref(false);
    }
  };

  const handleShareApp = async () => {
    const shareUrl = window.location.origin;
    const shareData = {
      title: "Habit Pulse",
      text: "Build unbreakable daily streaks with Habit Pulse! Check it out:",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("App link copied to clipboard!");
      }
    } catch (err: unknown) {
      // Ignore user cancelling the native share sheet
      if (err instanceof Error && err.name !== "AbortError") {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("App link copied to clipboard!");
      }
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

  const pushDescription = !isPushSupported
    ? "On iPhone/iPad, tap Share → Add to Home Screen first to enable push reminders."
    : pushPermission === "denied"
      ? "Blocked in browser settings. Enable notifications for this site to receive alerts."
      : "Receive native lock-screen reminders on this device even when the app is closed.";

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

            <NeuInput
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>

          {/* Notification Preferences */}
          <div className="space-y-3 pt-4 border-t border-black/5">
            <SettingToggleCard
              icon={Mail}
              title="Email Reminders"
              description="Receive scheduled habit reminders and streak updates in your inbox."
              checked={isNotificationsEnabled}
              onChange={() => setPendingToggle(!isNotificationsEnabled)}
            />

            <SettingToggleCard
              icon={BellRing}
              title="Device Push Notifications"
              description={pushDescription}
              checked={isPushEnabled}
              disabled={!isPushSupported || isPushLoading}
              onChange={handleTogglePush}
            />
          </div>

          {/* Save & Share Actions */}
          <div className="flex items-center justify-between w-full gap-3">
            <NeuButton
              type="button"
              onClick={handleShareApp}
              className="flex items-center gap-1.5 justify-center"
            >
              <Share2 className="w-4 h-4 text-neu-accent" />
              <span>Share App</span>
            </NeuButton>

            <NeuButton
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="flex items-center gap-1.5 min-w-[140px] justify-center"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </NeuButton>
          </div>
        </form>
      </NeuCard>

      <ConfirmActionModal
        isOpen={pendingToggle !== null}
        isTurningOff={pendingToggle === false}
        variant={pendingToggle === false ? "danger" : "primary"}
        title={
          pendingToggle === false
            ? "Turn off email reminders?"
            : "Turn on email reminders?"
        }
        description={
          pendingToggle === false
            ? "Do you want to stop receiving email notifications from Habit Pulse? You won't receive habit creation alerts or daily email reminders until you turn this back on."
            : "Do you want to start receiving email notifications from Habit Pulse again?"
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