/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

// 1. Background Push Listener
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: PushPayload = {};
  try {
    data = event.data.json() as PushPayload;
  } catch {
    data = { title: "Habit Pulse", body: event.data.text() };
  }

  const title = data.title ?? "Habit Pulse Reminder";
  const tag = data.tag ?? "habit-pulse-reminder";

  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body: data.body ?? "Time to complete your habit!",
    icon: "/pwa-192x192.png",
    badge: "/badge-96x96.png",
    tag,
    renotify: true,
    vibrate: [150, 75, 150],
    data: {
      url: data.url ?? "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Notification Tap Listener
self.addEventListener("notificationclick", (event) => {
  const targetPath = (event.notification.data?.url as string) || "/";
  const fullTargetUrl = new URL(targetPath, self.location.origin).href;

  event.notification.close();

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          try {
            if ("navigate" in client && client.url !== fullTargetUrl) {
              await client.navigate(fullTargetUrl);
            }
            const focusedClient = await client.focus();
            if (focusedClient) return;
          } catch {
            // Fall through to openWindow
          }
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(fullTargetUrl);
      }
    })()
  );
});

// 3. Auto-renew subscription if browser rotates push keys
self.addEventListener("pushsubscriptionchange", (event: Event) => {
  const pushEvent = event as ExtendableEvent & {
    oldSubscription?: PushSubscription;
  };
  const appServerKey = pushEvent.oldSubscription?.options?.applicationServerKey;
  if (!appServerKey) return;

  pushEvent.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey,
    })
  );
});