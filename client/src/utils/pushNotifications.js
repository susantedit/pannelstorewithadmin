/**
 * Web Push (VAPID) — Real OS push notifications
 * No Firebase Admin, no service account, no Google Cloud Console needed.
 *
 * Works on: Android Chrome, Desktop Chrome/Firefox/Edge, iOS Safari 16.4+
 *
 * Setup:
 *   client/.env  → VITE_VAPID_PUBLIC_KEY=BC0aVvtF...
 *   server/.env  → VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY + VAPID_EMAIL
 *   (keys already generated and in both .env files)
 */

import { showNotification } from './notify.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

let _swRegistration = null;

// ── Convert VAPID public key to Uint8Array ────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ── Register Service Worker ───────────────────────────────────────────────────
async function registerSW() {
  if (_swRegistration) return _swRegistration;
  if (!('serviceWorker' in navigator)) return null;

  try {
    _swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // Handle deep link navigation from SW notification click
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NAVIGATE' && event.data?.url) {
        window.location.href = event.data.url;
      }
    });

    console.log('[Push] Service worker registered');
    return _swRegistration;
  } catch (e) {
    console.error('[Push] SW registration failed:', e.message);
    return null;
  }
}

// ── Subscribe to push ─────────────────────────────────────────────────────────
export async function setupPushNotifications(onForegroundMessage) {
  if (!('Notification' in window) || !('PushManager' in window)) {
    console.warn('[Push] Not supported in this browser');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VITE_VAPID_PUBLIC_KEY not set in .env');
    return null;
  }

  // Request permission
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    console.warn('[Push] Permission denied');
    return null;
  }

  const swReg = await registerSW();
  if (!swReg) return null;

  try {
    // Check if already subscribed
    let subscription = await swReg.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe
      subscription = await swReg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('[Push] New subscription created');
    } else {
      console.log('[Push] Existing subscription found');
    }

    // Save to server
    await saveSubscription(subscription);

    // Handle foreground messages via polling (SW handles background)
    if (onForegroundMessage) {
      // Foreground notifications are handled by the existing 30s poll in UserDashboardPage
      // This callback is kept for compatibility
    }

    console.log('[Push] OS push notifications active');
    return subscription;
  } catch (e) {
    console.error('[Push] Subscribe failed:', e.message);
    return null;
  }
}

// ── Save subscription to server ───────────────────────────────────────────────
async function saveSubscription(subscription) {
  try {
    const { api } = await import('../services/api.js');
    const sub = subscription.toJSON();
    const res = await api.request('/api/push/subscribe', {
      method: 'POST',
      body:   JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth:   sub.keys.auth,
        },
      }),
    });
    if (res?.ok) console.log('[Push] Subscription saved to server');
  } catch (e) {
    console.warn('[Push] Failed to save subscription:', e.message);
  }
}

// ── Unsubscribe ───────────────────────────────────────────────────────────────
export async function unsubscribePush() {
  try {
    const swReg = await navigator.serviceWorker.ready;
    const sub   = await swReg.pushManager.getSubscription();
    if (sub) {
      const { api } = await import('../services/api.js');
      await api.request('/api/push/unsubscribe', {
        method: 'POST',
        body:   JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      console.log('[Push] Unsubscribed');
    }
  } catch (e) {
    console.warn('[Push] Unsubscribe failed:', e.message);
  }
}
