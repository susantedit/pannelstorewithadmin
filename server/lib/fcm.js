/**
 * Firebase Cloud Messaging — HTTP v1 API
 *
 * NO firebase-admin / service account JSON needed.
 * Uses Google OAuth2 with a Server Key (Legacy) OR
 * falls back to the Web API Key approach via FCM Legacy HTTP API.
 *
 * Setup: just add FIREBASE_SERVER_KEY to server/.env
 * Get it from: Firebase Console → Project Settings → Cloud Messaging
 *              → Cloud Messaging API (Legacy) → Server key
 *
 * If Legacy API is disabled, enable it:
 *   Firebase Console → Project Settings → Cloud Messaging →
 *   Cloud Messaging API (Legacy) → click the 3-dot menu → Manage API in Google Cloud Console → Enable
 */

const FCM_LEGACY_URL = 'https://fcm.googleapis.com/fcm/send';

function getServerKey() {
  return process.env.FIREBASE_SERVER_KEY || null;
}

function isReady() {
  const key = getServerKey();
  if (!key) {
    console.warn('[FCM] FIREBASE_SERVER_KEY not set in server/.env — push notifications disabled');
    return false;
  }
  return true;
}

// ── Build the notification payload ───────────────────────────────────────────

function buildPayload(tokens, notification, data = {}) {
  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  const siteUrl = process.env.CLIENT_URL || 'https://pannelstorewithadmin.vercel.app';

  const base = {
    notification: {
      title: notification.title || 'SUSANTEDIT',
      body:  notification.body  || '',
      icon:  `${siteUrl}/icon-192.png`,
      badge: `${siteUrl}/badge-96.png`,
      click_action: data.url || '/',
    },
    data: stringData,
    android: {
      priority: 'high',
      notification: {
        sound:    'default',
        color:    '#e63946',
        priority: 'high',
        default_vibrate_timings: true,
      },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
    webpush: {
      notification: {
        icon:               `${siteUrl}/icon-192.png`,
        badge:              `${siteUrl}/badge-96.png`,
        vibrate:            [200, 100, 200],
        requireInteraction: false,
      },
      fcm_options: { link: data.url || '/' },
    },
  };

  // Single token
  if (tokenList.length === 1) {
    return { ...base, to: tokenList[0] };
  }

  // Multiple tokens (multicast)
  return { ...base, registration_ids: tokenList };
}

// ── Send to token(s) ─────────────────────────────────────────────────────────

export async function sendPush(tokens, notification, data = {}) {
  if (!isReady()) return { sent: 0, failed: 0 };

  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  if (!tokenList.length) return { sent: 0, failed: 0 };

  const serverKey = getServerKey();
  let sent = 0;
  let failed = 0;
  const invalidTokens = [];

  // FCM legacy multicast supports max 1000 tokens per request
  for (let i = 0; i < tokenList.length; i += 1000) {
    const batch = tokenList.slice(i, i + 1000);
    try {
      const payload = buildPayload(batch, notification, data);
      const res = await fetch(FCM_LEGACY_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `key=${serverKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[FCM] HTTP error:', res.status, text);
        failed += batch.length;
        continue;
      }

      const result = await res.json();
      sent   += result.success  || 0;
      failed += result.failure  || 0;

      // Collect invalid tokens
      if (result.results) {
        result.results.forEach((r, idx) => {
          if (r.error === 'InvalidRegistration' || r.error === 'NotRegistered') {
            invalidTokens.push(batch[idx]);
          }
        });
      }
    } catch (e) {
      console.error('[FCM] sendPush error:', e.message);
      failed += batch.length;
    }
  }

  if (sent > 0) console.log(`[FCM] Sent ${sent}, failed ${failed}`);
  return { sent, failed, invalidTokens };
}

// ── Send to a single user by userId ─────────────────────────────────────────

export async function sendPushToUser(userId, notification, data = {}) {
  try {
    const { default: User } = await import('../models/User.js');
    const user = await User.findById(userId).select('fcmTokens');
    if (!user?.fcmTokens?.length) return { sent: 0, failed: 0 };

    const result = await sendPush(user.fcmTokens, notification, data);

    // Remove invalid tokens
    if (result.invalidTokens?.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { $in: result.invalidTokens } },
      });
    }

    return result;
  } catch (e) {
    console.error('[FCM] sendPushToUser error:', e.message);
    return { sent: 0, failed: 0 };
  }
}

// ── Broadcast to all users ───────────────────────────────────────────────────

export async function broadcastPush(notification, data = {}) {
  try {
    const { default: User } = await import('../models/User.js');
    const users = await User.find({
      role: 'user',
      fcmTokens: { $exists: true, $not: { $size: 0 } },
    }).select('fcmTokens').limit(2000);

    const allTokens = users.flatMap(u => u.fcmTokens || []);
    if (!allTokens.length) return { sent: 0, failed: 0 };

    return sendPush(allTokens, notification, data);
  } catch (e) {
    console.error('[FCM] broadcastPush error:', e.message);
    return { sent: 0, failed: 0 };
  }
}
