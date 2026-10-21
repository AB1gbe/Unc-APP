// Service worker: runs in the background, even when Unc isn't open, so
// the phone can show "New offer" notifications. It caches nothing on
// purpose (the app always loads fresh). See docs/Features/Push Notifications.md
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* plain text push */ }
  event.waitUntil(self.registration.showNotification(data.title || 'Unc', {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag,
    lang: data.lang,
    dir: data.dir || 'auto',
    data: { url: data.url || '/' },
  }));
});

// Tapping the notification opens that conversation, reusing an open Unc tab.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const tab = tabs.find((c) => new URL(c.url).origin === self.location.origin);
    if (tab) {
      await tab.focus();
      return tab.navigate(url);
    }
    return self.clients.openWindow(url);
  })());
});
