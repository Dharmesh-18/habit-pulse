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
    badge: "/pwa-192x192.png",
    tag: data.tag ?? "habit-pulse-reminder",
    data: {
      url: data.url ?? "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Notification Tap Listener (Opens or focuses Habit Pulse PWA)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data?.url as string) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing open tab/PWA window if available
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a fresh PWA window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});