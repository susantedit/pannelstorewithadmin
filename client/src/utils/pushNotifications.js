/**
 * Firebase Cloud Messaging (FCM) — Real OS push notifications
 * Shows in phone notification shade even when app is closed
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app as firebaseApp } from '../firebase/firebaseConfig.js';
import { showNotification } from './notify.js';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let _messaging = null;

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

/**
 * Register service worker and get FCM token.
 * Returns the token string, or null if not supported/denied.
 */
export async function registerPushNotifications() {
  // Check browser support
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('[FCM] Push notifications not supported in this browser');
    return null;
  }

  // Request permission
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    console.warn('[FCM] Notification permission denied');
    return null;
  }

  try {
    // Register service worker
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Send Firebase config to SW so it can initialize
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    // Wait for SW to be ready
    await navigator.serviceWorker.ready;

    if (swReg.active) {
      swReg.active.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig });
    }

    const messaging = getMessagingInstance();
    if (!messaging) return null;

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      console.log('[FCM] Token obtained:', token.substring(0, 20) + '...');
      return token;
    }

    console.warn('[FCM] No token received');
    return null;
  } catch (err) {
    console.error('[FCM] Registration failed:', err.message);
    return null;
  }
}

/**
 * Listen for foreground messages (app is open).
 * Shows in-app toast since OS notification won't fire when app is focused.
 */
export function onForegroundMessage(callback) {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {};
    const data = payload.data || {};

    // Show in-app notification
    const type = data.type || 'info';
    showNotification(title || 'SUSANTEDIT', body || '', type, 6000);

    // Call custom callback if provided
    if (callback) callback(payload);
  });
}

/**
 * Save FCM token to server so admin can send pushes to this user.
 */
export async function saveFcmToken(token) {
  try {
    const { api } = await import('../services/api.js');
    await api.request('/api/push/register', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  } catch (e) {
    console.warn('[FCM] Failed to save token to server:', e.message);
  }
}

/**
 * Full setup: register SW + get token + save to server + listen foreground.
 * Call this once after user logs in.
 */
export async function setupPushNotifications(onNewNotification) {
  const token = await registerPushNotifications();
  if (token) {
    await saveFcmToken(token);
    onForegroundMessage(onNewNotification);
  }
  return token;
}
