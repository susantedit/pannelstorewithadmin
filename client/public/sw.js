// SUSANTEDIT Service Worker — Web Push (VAPID)
// Handles OS-level push notifications when app is closed or in background

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── Push received ─────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { title: 'SUSANTEDIT', body: event.data?.text() || '' };
  }

  const title   = data.title   || 'SUSANTEDIT';
  const body    = data.body    || '';
  // Use absolute URL for icon — relative paths don't work in service workers
  const origin  = self.location.origin;
  const icon    = data.icon    || `${origin}/logo.png`;
  const badge   = data.badge   || `${origin}/logo.png`;
  const url     = data.data?.url || '/dashboard';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      vibrate:            [200, 100, 200],
      requireInteraction: false,
      data:               { url },
      actions: [
        { action: 'open',    title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// ── Notification click → open app ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url     = event.notification.data?.url || '/dashboard';
  const fullUrl = self.location.origin + url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url });
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(fullUrl);
    })
  );
});
