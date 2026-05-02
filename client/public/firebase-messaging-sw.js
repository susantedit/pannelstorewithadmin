// Firebase Cloud Messaging Service Worker
// This file MUST be at /firebase-messaging-sw.js (root of public)
// It handles background push notifications when the app is closed/minimized

importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js');

// These values are safe to expose — they're public Firebase config
// They get replaced at build time via the SW registration in pushNotifications.js
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    // Handle background messages (app closed or in background)
    messaging.onBackgroundMessage((payload) => {
      const { title, body, icon, image, data } = payload.notification || {};
      const notifTitle = title || 'SUSANTEDIT';
      const notifOptions = {
        body: body || '',
        icon: icon || '/logo.png',
        badge: '/logo.png',
        image: image,
        data: data || payload.data || {},
        vibrate: [200, 100, 200],
        requireInteraction: true,
        actions: [
          { action: 'open', title: '👁 View' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      };
      self.registration.showNotification(notifTitle, notifOptions);
    });
  }
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
