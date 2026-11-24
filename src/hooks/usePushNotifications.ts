// src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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
  const [isTesting, setIsTesting] = useState(false);

  const subscribeMutation = useMutation(
    api.notifications.pushSubscriptions.subscribe
  );
  const unsubscribeMutation = useMutation(
    api.notifications.pushSubscriptions.unsubscribe
  );
  const sendTestPushAction = useAction(
    api.notifications.webPush.sendTestPush
  );

  // Sync & auto-heal existing browser subscription with Convex DB on mount
  useEffect(() => {
    if (!isSupported || !sessionToken) return;
    let active = true;

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then(async (sub) => {
        if (!active) return;
        setPermission(Notification.permission);

        if (sub && Notification.permission === "granted") {
          setCurrentEndpoint(sub.endpoint);
          const json = sub.toJSON();
          if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
            await subscribeMutation({
              sessionToken,
              endpoint: json.endpoint,
              p256dh: json.keys.p256dh,
              auth: json.keys.auth,
              userAgent: navigator.userAgent.slice(0, 120),
            }).catch(() => {});
          }
        } else {
          setCurrentEndpoint(undefined);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isSupported, sessionToken, subscribeMutation]);

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

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();
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

      // Force clean re-subscribe so stale VAPID/FCM endpoints are replaced
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await unsubscribeMutation({
          sessionToken,
          endpoint: existingSub.endpoint,
        }).catch(() => {});
        await existingSub.unsubscribe().catch(() => {});
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

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
  }, [isSupported, sessionToken, subscribeMutation, unsubscribeMutation]);

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

  const sendTestNotification = useCallback(async () => {
    setIsTesting(true);
    try {
      return await sendTestPushAction({ sessionToken });
    } finally {
      setIsTesting(false);
    }
  }, [sessionToken, sendTestPushAction]);

  return {
    isSupported,
    permission,
    isEnabled,
    isLoading,
    isTesting,
    enablePush,
    disablePush,
    sendTestNotification,
  };
}