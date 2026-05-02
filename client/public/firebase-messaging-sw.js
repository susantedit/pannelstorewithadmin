// Firebase Cloud Messaging Service Worker
// IMPORTANT: Firebase config is hardcoded here because the SW
// cannot reliably receive postMessage before a push arrives.
// These are PUBLIC keys — safe to expose in frontend code.

importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js');

// ── Hardcoded Firebase config (same as client/.env VITE_FIREBASE_*) ──────────
// Update these if you change your Firebase project
const firebaseConfig = {
  apiKey:            "AIzaSyCRuN5KnvDVrlo5znWwL3UWpGc4nZzJlk8",
  authDomain:        "vortex-universal-downloder.firebaseapp.com",
  projectId:         "vortex-universal-downloder",
  storageBucket:     "vortex-universal-downloder.firebasestorage.app",
  messagingSenderId: "499149047761",
  appId:             "1:499149047761:web:747b5e85ace2216f9782f0",
};

// Initialize Firebase in the SW (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// ── Background message handler ────────────────────────────────────────────────
// Fires when app is closed or in background
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notification = payload.notification || {};
  const data         = payload.data         || {};

  const title = notification.title || 'SUSANTEDIT';
  const body  = notification.body  || '';
  const icon  = notification.icon  || '/logo.png';
  const url   = data.url           || '/dashboard';

  self.registration.showNotification(title, {
    body,
    icon,
    badge:             '/logo.png',
    vibrate:           [200, 100, 200, 100, 200],
    requireInteraction: false,
    data:              { url, ...data },
    actions: [
      { action: 'open',    title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
});

// ── Notification click → open app ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard';
  const fullUrl = self.location.origin + url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          // Navigate to the deep link
          client.postMessage({ type: 'NAVIGATE', url });
          return;
        }
      }
      // Open new tab
      if (clients.openWindow) return clients.openWindow(fullUrl);
    })
  );
});
