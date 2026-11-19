/* Web push for the Sonarhorin PWA. Loaded into the generated service worker via workbox.importScripts
 * (vite.config.js). Server payload (JSON): { title, body, url } */
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data && event.data.text() }; }
  const title = data.title || "সোনারহরিণ (Sonarhorin)";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/logo-gold.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
      tag: data.tag || undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url === target && "focus" in c) return c.focus();
      }
      for (const c of list) {
        if (new URL(c.url).origin === self.location.origin && "navigate" in c) {
          return c.focus().then(() => c.navigate(target)).catch(() => self.clients.openWindow(target));
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
