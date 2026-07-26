/* Kaynak Kampüs — Web Push service worker.
   Sunucudan gelen push olayında bildirim gösterir; tıklanınca ilgili
   sayfayı açar/öne getirir. Yükü (payload) src/lib/push.ts üretir. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let veri = {};
  try {
    veri = event.data ? event.data.json() : {};
  } catch {
    veri = { baslik: "Kaynak Kampüs", govde: event.data ? event.data.text() : "" };
  }
  const baslik = veri.baslik || "Kaynak Kampüs";
  const secenekler = {
    body: veri.govde || "",
    icon: "/assets/kaynak-kampus-logo.png",
    badge: "/assets/kaynak-kampus-logo-192.png",
    tag: veri.etiket || "genel",
    renotify: true,
    data: { url: veri.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(baslik, secenekler));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const hedef = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((liste) => {
      for (const istemci of liste) {
        if ("focus" in istemci) {
          istemci.navigate(hedef);
          return istemci.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(hedef);
    })
  );
});
