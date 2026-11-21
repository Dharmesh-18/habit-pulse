// src/components/profile/ProfileView.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { NeuCard } from "../ui/NeuCard";
import { NeuButton } from "../ui/NeuButton";
import { NeuInput } from "../ui/NeuInput";
import { UserAvatar } from "../ui/UserAvatar";
import { useToast } from "../../context/ToastContext";
import { parseConvexError } from "../../lib/errorUtils";
import {
  Camera,
  ArrowLeft,
  Lock,
  Check,
  BellRing,
  Mail,
  Share2,
  Volume2,
  LogOut,
} from "lucide-react";
import { ConfirmActionModal } from "../ui/ConfirmActionModal";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { SettingToggleCard } from "../ui/SettingToggleCard";
import { BoughtAvatarsShelf } from "./BoughtAvatarsShelf";
import {
  isSoundEnabled,
  setSoundEnabled,
  soundFX,
} from "../../lib/soundEffects";
import { HabitReportCard } from "./HabitReportCard";

interface ProfileViewProps {
  user: {
    id: string;
    email: string;
    name: string;
    avatarStorageId?: Id<"_storage">;
    presetAvatarId?: string;
    notificationsEnabled?: boolean;
  };
  sessionToken: string;
  onBack: () => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  sessionToken,
  onBack,
  onLogout,
}) => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [name, setName] = useState(user.name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(
    user.presetAvatarId,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) soundFX.checkHabit();
  };

  // Wallet & Shop Avatars for BoughtAvatarsShelf
  const wallet = useQuery(api.shop.index.getMyWallet, { sessionToken });
  const shopAvatars = useQuery(api.shop.index.listShopItems, {
    sessionToken,
    itemType: "avatar",
  });

  const boughtAvatars = useMemo(() => {
    if (!wallet || !shopAvatars) return [];
    const boughtSet = new Set(wallet.boughtItems);
    return shopAvatars
      .filter((item) => boughtSet.has(item.itemKey))
      .map((item) => ({
        itemKey: item.itemKey,
        title: item.title,
        assetPath: item.assetPath,
      }));
  }, [wallet, shopAvatars]);

  // Handle ?equip=avatar-xxx redirect from ShopPage
  useEffect(() => {
    const equipKey = searchParams.get("equip");
    if (!equipKey || boughtAvatars.length === 0) return;

    const targetAvatar = boughtAvatars.find((a) => a.itemKey === equipKey);
    if (targetAvatar) {
      setSelectedPresetId(targetAvatar.itemKey);
      setSelectedFile(null);
      setPreviewUrl(targetAvatar.assetPath);

      // Clean ?equip param from URL after applying preview
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("equip");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, boughtAvatars]);

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
      setSelectedPresetId(undefined); // Clear preset selection when custom photo is chosen
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSelectBoughtAvatar = (item: {
    itemKey: string;
    title: string;
    assetPath: string;
  }) => {
    setSelectedPresetId(item.itemKey);
    setSelectedFile(null);
    setPreviewUrl(item.assetPath);
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
        presetAvatarId: newStorageId ? undefined : selectedPresetId,
      });

      toast.success("Profile updated successfully!");
      setSelectedFile(null);
      setPreviewUrl(null);
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

  const hasUnsavedCustomPhoto = Boolean(selectedFile);
  const hasSavedCustomPhoto =
    Boolean(user.avatarStorageId) &&
    !selectedPresetId &&
    !hasUnsavedCustomPhoto;

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
          {/* Avatar Upload & Live Preview Area */}
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
                  presetAvatarId={user.presetAvatarId}
                  size="xl"
                />
              )}

              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-neu-bg shadow-neu-flat flex items-center justify-center text-neu-accent hover:text-neu-dark cursor-pointer active:shadow-neu-pressed transition-all"
                title="Upload Custom Photo"
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
              Upload a photo or pick from your purchased avatars below
            </p>
          </div>

          {/* Horizontally Scrollable Purchased Avatars Shelf */}
          <BoughtAvatarsShelf
            avatars={boughtAvatars}
            selectedPresetId={selectedPresetId}
            hasCustomPhoto={hasUnsavedCustomPhoto || hasSavedCustomPhoto}
            onSelectAvatar={handleSelectBoughtAvatar}
          />

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

            <SettingToggleCard
              icon={Volume2}
              title="Interactive Sound Effects"
              description="Play subtle tactile sounds when adding, completing, or unlocking streak milestones."
              checked={soundOn}
              onChange={handleToggleSound}
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

        {/* AI Habit Performance Report Generator */}
        <div className="pt-4 border-t border-black/5">
          <HabitReportCard sessionToken={sessionToken} />
        </div>

        {/* Session Actions — Bottom Full-Width Logout */}
        <div className="pt-4 border-t border-black/5">
          <NeuButton
            type="button"
            variant="danger"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 flex items-center justify-center gap-2 font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </NeuButton>
        </div>
      </NeuCard>

      {/* Email Reminder Confirmation Modal */}
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

      {/* Logout Confirmation Modal */}
      <ConfirmActionModal
        isOpen={showLogoutConfirm}
        isTurningOff
        variant="danger"
        title="Log out of Habit Pulse?"
        description="You will need to sign in again with your email to access your habits and streaks on this device."
        confirmLabel="Yes, Log Out"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};
