/* BeDeBest service worker: installable PWA + Web Push.
   Event "push" tiba dari server (cron harian 00:00 WIB) walau web tertutup. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // passthrough: belum ada strategi offline cache
});

self.addEventListener("push", (event) => {
  let data = { title: "BeDeBest", body: "Ada kabar baru dari kelas!", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) { /* abaikan payload rusak */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.svg",
      badge: "/logo.svg",
      tag: "bedebest-harian",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(self.clients.openWindow(url));
});
