// public/sw.js
// AxeonPROOF's service worker: shows lead notifications and opens the lead when
// one is tapped. Payloads carry only a title, one line and a PROOF path
// (lib/pushShared.ts), never a phone number or a message. No caching and no
// fetch handler: PROOF is always live data, so nothing authenticated is stored.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === 'string' ? data.title : 'New lead activity';
  const body = typeof data.body === 'string' ? data.body : 'Open AxeonPROOF to see it.';
  // Only a path on this site: never an outside link.
  const url = typeof data.url === 'string' && /^\/(?!\/)/.test(data.url) ? data.url : '/';
  event.waitUntil(
    self.registration.showNotification(title, { body, icon: '/icon.png', badge: '/icon.png', tag: url, renotify: true, data: { url } }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const w of windows) {
        if ('focus' in w) {
          await w.navigate(url).catch(() => undefined); // an uncontrolled window cannot be navigated; focusing it is enough
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
