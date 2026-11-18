/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

declare let self: ServiceWorkerGlobalScope;

// Auto-activate updated SW immediately
self.skipWaiting();
clientsClaim();

// Precache Vite build assets & clean old caches
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

// 1. Background Push Listener (Runs even when app/browser is closed)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: PushPayload = {};
  try {
    data = event.data.json() as PushPayload;
  } catch {
    data = { title: "Habit Pulse", body: event.data.text() };
  }

  const title = data.title ?? "Habit Pulse Reminder";
  const options: NotificationOptions = {
    body: data.body ?? "Time to complete your habit!",
    icon: "/pwa-192x192.png",
    badge: "/badge-96x96.png",
    tag: data.tag ?? "habit-pulse-reminder",
    data: {
      url: data.url ?? "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Notification Tap Listener (Opens or focuses Habit Pulse PWA)
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

      // 1. Try focusing an active, unfrozen Habit Pulse window
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          try {
            if ("navigate" in client && client.url !== fullTargetUrl) {
              await client.navigate(fullTargetUrl);
            }
            const focusedClient = await client.focus();
            if (focusedClient) return;
          } catch {
            // If client was frozen/discarded by mobile OS, fall through to openWindow
          }
        }
      }

      // 2. Cold start or frozen client fallback: open PWA window directly
      if (self.clients.openWindow) {
        await self.clients.openWindow(fullTargetUrl);
      }
    })()
  );
});