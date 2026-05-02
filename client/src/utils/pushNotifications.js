/**
 * Firebase Cloud Messaging (FCM) — Real OS push notifications
 * Shows in phone notification shade even when app is closed.
 *
 * REQUIREMENTS (must be set in Vercel env vars + client/.env):
 *   VITE_FIREBASE_VAPID_KEY  — from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
 *
 * REQUIREMENTS (must be set in Render env vars + server/.env):
 *   FIREBASE_CLIENT_EMAIL    — from Firebase service account JSON
 *   FIREBASE_PRIVATE_KEY     — from Firebase service account JSON
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app as firebaseApp } from '../firebase/firebaseConfig.js';
import { showNotification } from './notify.js';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let _messaging = null;
let _swRegistration = null;

function getMessagingInstance() {
  if (_messaging) return _messaging;
  try {
    _messaging = getMessaging(firebaseApp);
    return _messaging;
  } catch (e) {
    console.warn('[FCM] Messaging not available:', e.message);
    return null;
  }
}

// ── Register Service Worker ───────────────────────────────────────────────────

async function registerSW() {
  if (_swRegistration) return _swRegistration;
  if (!('serviceWorker' in navigator)) return null;

  try {
    // Register the SW — config is hardcoded inside the SW file
    _swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;
    console.log('[FCM] Service worker registered');

    // Listen for navigate messages from SW (notification click deep link)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NAVIGATE' && event.data?.url) {
        window.location.href = event.data.url;
      }
    });

    return _swRegistration;
  } catch (e) {
    console.error('[FCM] SW registration failed:', e.message);
    return null;
  }
}

// ── Request permission + get FCM token ───────────────────────────────────────

export async function registerPushNotifications() {
  if (!('Notification' in window)) {
    console.warn('[FCM] Notifications not supported');
    return null;
  }

  // Request permission
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    console.warn('[FCM] Permission denied:', permission);
    return null;
  }

  if (!VAPID_KEY) {
    console.error('[FCM] VITE_FIREBASE_VAPID_KEY is not set. Add it to .env and Vercel env vars.');
    return null;
  }

  const swReg = await registerSW();
  if (!swReg) return null;

  const messaging = getMessagingInstance();
  if (!messaging) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      console.log('[FCM] Token:', token.slice(0, 20) + '...');
      return token;
    }

    console.warn('[FCM] No token returned — check VAPID key and Firebase project settings');
    return null;
  } catch (e) {
    console.error('[FCM] getToken failed:', e.message);
    return null;
  }
}

// ── Foreground message handler ────────────────────────────────────────────────
// When app is open, OS won't show a notification — show in-app toast instead

export function onForegroundMessage(callback) {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message:', payload);
    const { title, body } = payload.notification || {};
    const data = payload.data || {};
    showNotification(title || 'SUSANTEDIT', body || '', data.type || 'info', 6000);
    if (callback) callback(payload);
  });
}

// ── Save token to server ──────────────────────────────────────────────────────

export async function saveFcmToken(token) {
  try {
    const { api } = await import('../services/api.js');
    const res = await api.request('/api/push/register', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (res?.ok) console.log('[FCM] Token saved to server');
  } catch (e) {
    console.warn('[FCM] Failed to save token:', e.message);
  }
}

// ── Full setup (call once after login) ───────────────────────────────────────

export async function setupPushNotifications(onNewNotification) {
  const token = await registerPushNotifications();
  if (token) {
    await saveFcmToken(token);
    onForegroundMessage(onNewNotification);
    console.log('[FCM] Push notifications active');
  } else {
    console.warn('[FCM] Push notifications not active — check VAPID key and permissions');
  }
  return token;
}
