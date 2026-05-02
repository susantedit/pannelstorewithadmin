/**
 * Firebase Cloud Messaging — server-side push sender
 * Uses firebase-admin to send real OS push notifications to users' devices
 */

import admin from 'firebase-admin';

let _initialized = false;

function initAdmin() {
  if (_initialized || admin.apps.length > 0) {
    _initialized = true;
    return true;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[FCM] Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in .env — push notifications disabled');
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    _initialized = true;
    console.log('[FCM] Firebase Admin initialized ✓');
    return true;
  } catch (e) {
    console.error('[FCM] Admin init failed:', e.message);
    return false;
  }
}

/**
 * Send a push notification to one or more FCM tokens.
 * @param {string|string[]} tokens - FCM device token(s)
 * @param {object} notification - { title, body }
 * @param {object} data - extra key-value pairs (all strings)
 */
export async function sendPush(tokens, notification, data = {}) {
  if (!initAdmin()) return { sent: 0, failed: 0 };

  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  if (tokenList.length === 0) return { sent: 0, failed: 0 };

  const message = {
    notification: {
      title: notification.title || 'SUSANTEDIT',
      body: notification.body || '',
    },
    android: {
      notification: {
        icon: 'ic_notification',
        color: '#e63946',
        sound: 'default',
        channelId: 'susantedit_default',
        priority: 'high',
        defaultVibrateTimings: true,
      },
      priority: 'high',
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          'content-available': 1,
        },
      },
    },
    webpush: {
      notification: {
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
      },
      fcmOptions: {
        link: data.url || '/dashboard',
      },
    },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
  };

  let sent = 0;
  let failed = 0;
  const invalidTokens = [];

  // Send in batches of 500 (FCM limit)
  for (let i = 0; i < tokenList.length; i += 500) {
    const batch = tokenList.slice(i, i + 500);
    try {
      const response = await admin.messaging().sendEachForMulticast({
        ...message,
        tokens: batch,
      });
      sent += response.successCount;
      failed += response.failureCount;

      // Collect invalid tokens for cleanup
      response.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = r.error?.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(batch[idx]);
          }
        }
      });
    } catch (e) {
      console.error('[FCM] Batch send error:', e.message);
      failed += batch.length;
    }
  }

  return { sent, failed, invalidTokens };
}

/**
 * Send push to a single user by their userId (looks up stored tokens).
 */
export async function sendPushToUser(userId, notification, data = {}) {
  try {
    const { default: User } = await import('../models/User.js');
    const user = await User.findById(userId).select('fcmTokens');
    if (!user?.fcmTokens?.length) return { sent: 0, failed: 0 };

    const result = await sendPush(user.fcmTokens, notification, data);

    // Clean up invalid tokens
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

/**
 * Broadcast push to all users (up to 1000).
 */
export async function broadcastPush(notification, data = {}) {
  try {
    const { default: User } = await import('../models/User.js');
    const users = await User.find({
      role: 'user',
      fcmTokens: { $exists: true, $not: { $size: 0 } },
    }).select('fcmTokens').limit(1000);

    const allTokens = users.flatMap(u => u.fcmTokens || []);
    if (allTokens.length === 0) return { sent: 0, failed: 0 };

    return sendPush(allTokens, notification, data);
  } catch (e) {
    console.error('[FCM] broadcastPush error:', e.message);
    return { sent: 0, failed: 0 };
  }
}
