// src/hooks/usePWAInstall.ts
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Module-level store so we never miss the event even before AppHeader mounts
let savedPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    savedPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    savedPrompt = null;
    notifyListeners();
  });
}

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(() => savedPrompt);

  useEffect(() => {
    const sync = () => setPromptEvent(savedPrompt);
    // Sync immediately on mount in case event fired earlier
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const promptInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      savedPrompt = null;
      notifyListeners();
    }
  };

  return {
    canInstall: promptEvent !== null,
    promptInstall,
  };
}