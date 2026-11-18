// src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// src/hooks/usePushNotifications.ts
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(sessionToken: string) {
  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const [permission, setPermission] = useState<NotificationPermission>(() =>
    isSupported ? Notification.permission : "denied"
  );
  const [currentEndpoint, setCurrentEndpoint] = useState<string | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  const subscribeMutation = useMutation(
    api.notifications.pushSubscriptions.subscribe
  );
  const unsubscribeMutation = useMutation(
    api.notifications.pushSubscriptions.unsubscribe
  );

  // Sync existing browser subscription endpoint on mount
  useEffect(() => {
    if (!isSupported) return;
    let active = true;

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (active) {
          setCurrentEndpoint(sub?.endpoint);
          setPermission(Notification.permission);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isSupported]);

  const isRegisteredInDb = useQuery(
    api.notifications.pushSubscriptions.isEndpointSubscribed,
    sessionToken && currentEndpoint
      ? { sessionToken, endpoint: currentEndpoint }
      : "skip"
  );

  const isEnabled =
    isSupported &&
    permission === "granted" &&
    Boolean(currentEndpoint) &&
    isRegisteredInDb === true;

  const enablePush = useCallback(async () => {
    if (!isSupported) {
      throw new Error("Push notifications are not supported on this browser.");
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error("VAPID public key is not configured.");
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        throw new Error(
          "Notification permission blocked. Please allow notifications in browser settings."
        );
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Failed to generate browser push keys.");
      }

      await subscribeMutation({
        sessionToken,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        userAgent: navigator.userAgent.slice(0, 120),
      });

      setCurrentEndpoint(json.endpoint);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, sessionToken, subscribeMutation]);

  const disablePush = useCallback(async () => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await unsubscribeMutation({
          sessionToken,
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }

      setCurrentEndpoint(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, sessionToken, unsubscribeMutation]);

  return {
    isSupported,
    permission,
    isEnabled,
    isLoading,
    enablePush,
    disablePush,
  };
}