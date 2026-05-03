/**
 * Web Push — OS-level push notifications
 * No Firebase Admin, no service account, no Google Cloud Console.
 * Works on Android Chrome, Desktop Chrome/Firefox/Edge, iOS Safari 16.4+
 *
 * Keys are in server/.env:
 *   VAPID_PUBLIC_KEY   — also in client/.env as VITE_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_EMAIL        — mailto:your@email.com
 */

import webpush from 'web-push';

let _initialized = false;

function init() {
  if (_initialized) return true;
  const pub   = process.env.VAPID_PUBLIC_KEY;
  const priv  = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:admin@susantedit.com';

  if (!pub || !priv) {
    console.warn('[WebPush] VAPID keys not set — push disabled');
    return false;
  }

  webpush.setVapidDetails(email, pub, priv);
  _initialized = true;
  console.log('[WebPush] VAPID initialized ✓');
  return true;
}

/**
 * Send push to a single subscription object.
 * subscription = { endpoint, keys: { p256dh, auth } }
 */
export async function sendPushToSubscription(subscription, title, body, data = {}) {
  if (!init()) return false;
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, icon: '/logo.png', badge: '/logo.png', data })
    );
    return true;
  } catch (e) {
    if (e.statusCode === 410 || e.statusCode === 404) {
      // Subscription expired — caller should remove it
      return 'expired';
    }
    console.error('[WebPush] send error:', e.message);
    return false;
  }
}

/**
 * Send push to a user by userId — looks up their stored subscriptions.
 */
export async function sendPushToUser(userId, title, body, data = {}) {
  if (!init()) return { sent: 0, failed: 0 };
  try {
    const { default: User } = await import('../models/User.js');
    const user = await User.findById(userId).select('pushSubscriptions');
    if (!user?.pushSubscriptions?.length) return { sent: 0, failed: 0 };

    let sent = 0, failed = 0;
    const expired = [];

    for (const sub of user.pushSubscriptions) {
      const result = await sendPushToSubscription(sub, title, body, data);
      if (result === true)       sent++;
      else if (result === 'expired') { expired.push(sub.endpoint); failed++; }
      else                       failed++;
    }

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushSubscriptions: { endpoint: { $in: expired } } }
      });
    }

    return { sent, failed };
  } catch (e) {
    console.error('[WebPush] sendPushToUser error:', e.message);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Broadcast to all users with subscriptions.
 */
export async function broadcastPush(title, body, data = {}) {
  if (!init()) return { sent: 0, failed: 0 };
  try {
    const { default: User } = await import('../models/User.js');
    const users = await User.find({
      role: 'user',
      pushSubscriptions: { $exists: true, $not: { $size: 0 } }
    }).select('_id pushSubscriptions').limit(2000).lean();

    let sent = 0, failed = 0;

    for (const user of users) {
      const r = await sendPushToUser(user._id, title, body, data);
      sent   += r.sent;
      failed += r.failed;
    }

    console.log(`[WebPush] Broadcast: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  } catch (e) {
    console.error('[WebPush] broadcastPush error:', e.message);
    return { sent: 0, failed: 0 };
  }
}
