import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendPushToUser as sendVapidToUser, broadcastPush as broadcastVapid } from '../lib/webpush.js';
import { sendPushToUser as sendFcmToUser, broadcastPush as broadcastFcm } from '../lib/fcm.js';

// Send push via both FCM (background-capable) and VAPID (fallback)
async function pushToUser(userId, title, body, data = {}) {
  const [fcm, vapid] = await Promise.allSettled([
    sendFcmToUser(userId, { title, body }, data),
    sendVapidToUser(userId, title, body, data),
  ]);
  const fcmSent   = fcm.value?.sent   || 0;
  const vapidSent = vapid.value?.sent || 0;
  return { sent: fcmSent + vapidSent };
}

async function broadcastAll(title, body, data = {}) {
  await Promise.allSettled([
    broadcastFcm({ title, body }, data),
    broadcastVapid(title, body, data),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART TARGETING — classify user segment
// ─────────────────────────────────────────────────────────────────────────────

export function getUserSegment(user) {
  const now = new Date();
  const hoursSinceActive = user.lastActiveAt
    ? (now - new Date(user.lastActiveAt)) / 3600000
    : 9999;
  const isNew       = !user.lastLoginAt || (now - new Date(user.createdAt)) < 3 * 24 * 3600000;
  const isInactive  = hoursSinceActive > 48;
  const isVip       = user.vipExpiresAt && new Date(user.vipExpiresAt) > now;
  const isHighSpend = (user.totalSpend || 0) >= 1000;
  const isElite     = (user.xp || 0) >= 500;
  const justBought  = user.lastOrderProduct &&
    user.lastNotifAt && (now - new Date(user.lastNotifAt)) < 2 * 3600000;

  if (isNew)       return 'new';
  if (justBought)  return 'just_bought';
  if (isVip)       return 'vip';
  if (isHighSpend) return 'high_spender';
  if (isElite)     return 'elite';
  if (isInactive)  return 'inactive';
  return 'regular';
}

// ─────────────────────────────────────────────────────────────────────────────
// COOLDOWN — max 3 notifications per user per day
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PER_DAY = 3;

async function checkCooldown(user) {
  const now = new Date();
  const today = now.toDateString();
  const lastDate = user.notifSentDate ? new Date(user.notifSentDate).toDateString() : null;

  // Reset counter if it's a new day
  if (lastDate !== today) {
    await User.findByIdAndUpdate(user._id, {
      notifSentToday: 0,
      notifSentDate: now,
      notifRoastToday: false,
    });
    return true; // allowed
  }

  return (user.notifSentToday || 0) < MAX_PER_DAY;
}

async function incrementCooldown(userId, isRoast = false) {
  const update = { $inc: { notifSentToday: 1 }, lastNotifAt: new Date() };
  if (isRoast) update.notifRoastToday = true;
  await User.findByIdAndUpdate(userId, update);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROAST SAFETY — never roast new users or users who just bought
// ─────────────────────────────────────────────────────────────────────────────

function canSendRoast(user) {
  const segment = getUserSegment(user);
  if (segment === 'new' || segment === 'just_bought') return false;
  if (user.notifRoastToday) return false; // already roasted today
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE: createNotification — saves to DB + FCM push
// ─────────────────────────────────────────────────────────────────────────────

export async function createNotification(userId, title, message, type = 'info', options = {}) {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      fromAdmin:   options.fromAdmin   || false,
      adminId:     options.adminId     || null,
      relatedType: options.relatedType || 'system',
      relatedId:   options.relatedId   || null,
      deepLink:    options.deepLink    || '/dashboard',
      tone:        options.tone        || 'info',
      metadata:    options.metadata    || {},
    });

    // Web Push — non-blocking OS notification (FCM + VAPID)
    pushToUser(
      userId,
      title,
      message,
      { type, url: options.deepLink || '/dashboard', notificationId: String(notification._id) }
    ).catch(() => {});

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART SEND — respects cooldown, targeting, roast safety
// ─────────────────────────────────────────────────────────────────────────────

export async function smartSend(userId, notif, options = {}) {
  try {
    const user = await User.findById(userId).select(
      'lastActiveAt lastLoginAt createdAt vipExpiresAt totalSpend xp lastOrderProduct lastNotifAt notifSentToday notifSentDate notifRoastToday'
    );
    if (!user) return null;

    // Cooldown check
    const allowed = await checkCooldown(user);
    if (!allowed) return null;

    // Roast safety
    const isRoast = options.tone === 'roast';
    if (isRoast && !canSendRoast(user)) return null;

    const result = await createNotification(userId, notif.title, notif.message, notif.type || 'info', {
      ...options,
      tone: options.tone || 'info',
    });

    if (result) await incrementCooldown(userId, isRoast);
    return result;
  } catch (e) {
    console.error('[smartSend] error:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENT-AWARE BROADCAST — picks right tone per user
// ─────────────────────────────────────────────────────────────────────────────

export async function segmentedBroadcast(pools, options = {}) {
  // pools = { new, inactive, vip, high_spender, elite, regular, just_bought }
  // Each pool entry: { title, message, type, tone, deepLink }
  try {
    const users = await User.find({ role: 'user' })
      .select('_id lastActiveAt lastLoginAt createdAt vipExpiresAt totalSpend xp lastOrderProduct lastNotifAt notifSentToday notifSentDate notifRoastToday')
      .limit(2000)
      .lean();

    let sent = 0;
    const batchSize = 30;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (user) => {
          const segment = getUserSegment(user);
          const notif = pools[segment] || pools.regular;
          if (!notif) return;

          // Cooldown
          const today = new Date().toDateString();
          const lastDate = user.notifSentDate ? new Date(user.notifSentDate).toDateString() : null;
          const count = lastDate === today ? (user.notifSentToday || 0) : 0;
          if (count >= MAX_PER_DAY) return;

          // Roast safety
          const isRoast = notif.tone === 'roast';
          if (isRoast && !canSendRoast(user)) return;

          const result = await createNotification(
            user._id, notif.title, notif.message, notif.type || 'info',
            { tone: notif.tone || 'info', deepLink: notif.deepLink || '/dashboard', ...options }
          );
          if (result) {
            await incrementCooldown(user._id, isRoast);
            sent++;
          }
        })
      );
    }

    console.log(`[segmentedBroadcast] Sent to ${sent} users`);
    return sent;
  } catch (e) {
    console.error('[segmentedBroadcast] error:', e.message);
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET USER NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserNotifications(req, res) {
  try {
    const userId = req.auth?.userId;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const unreadOnly = req.query.unread === 'true';

    const query = { userId };
    if (unreadOnly) query.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.json({ ok: true, notifications, total, unreadCount, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK READ
// ─────────────────────────────────────────────────────────────────────────────

export async function markNotificationsRead(req, res) {
  try {
    const userId = req.auth?.userId;
    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || !notificationIds.length) {
      return res.status(400).json({ ok: false, message: 'notificationIds array required' });
    }
    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, userId, read: false },
      { read: true, readAt: new Date(), opened: true, openedAt: new Date() }
    );
    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.auth?.userId;
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date(), opened: true, openedAt: new Date() }
    );
    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRACK CLICK (called when user taps notification)
// ─────────────────────────────────────────────────────────────────────────────

export async function trackNotificationClick(req, res) {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;
    await Notification.findOneAndUpdate(
      { _id: id, userId },
      { clicked: true, clickedAt: new Date(), opened: true, openedAt: new Date(), read: true, readAt: new Date() }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: SEND CUSTOM NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export async function sendCustomNotification(req, res) {
  try {
    const { targetType, targetUserId, targetSegment, title, message, type = 'info', tone = 'info', deepLink = '/dashboard' } = req.body;
    const adminId = req.auth?.userId;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ ok: false, message: 'Title and message are required' });
    }
    if (!['specific', 'all', 'segment'].includes(targetType)) {
      return res.status(400).json({ ok: false, message: 'targetType must be specific, all, or segment' });
    }

    let targetUsers = [];

    if (targetType === 'specific') {
      if (!targetUserId) return res.status(400).json({ ok: false, message: 'targetUserId required' });
      const user = await User.findById(targetUserId);
      if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
      targetUsers = [user];
    } else if (targetType === 'segment') {
      // Target by segment: inactive, new, vip, high_spender, elite, regular
      const allUsers = await User.find({ role: 'user' })
        .select('_id lastActiveAt lastLoginAt createdAt vipExpiresAt totalSpend xp lastOrderProduct lastNotifAt')
        .limit(2000).lean();
      targetUsers = allUsers.filter(u => getUserSegment(u) === (targetSegment || 'regular'));
    } else {
      targetUsers = await User.find({ role: 'user' }).select('_id').limit(1000);
    }

    const notifications = await Promise.all(
      targetUsers.map(user =>
        createNotification(user._id, title.trim(), message.trim(), type, {
          fromAdmin: true, adminId, relatedType: 'custom', tone, deepLink,
        })
      )
    );

    const successCount = notifications.filter(Boolean).length;

    if (targetType === 'all') {
      broadcastAll(title.trim(), message.trim(), { type, url: deepLink }).catch(() => {});
    }

    res.json({ ok: true, message: `Notification sent to ${successCount} user${successCount !== 1 ? 's' : ''}`, sentCount: successCount });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotificationStats(req, res) {
  try {
    const [total, unread, opened, clicked, byTone, recent] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ read: false }),
      Notification.countDocuments({ opened: true }),
      Notification.countDocuments({ clicked: true }),
      Notification.aggregate([
        { $group: { _id: '$tone', count: { $sum: 1 }, opened: { $sum: { $cond: ['$opened', 1, 0] } }, clicked: { $sum: { $cond: ['$clicked', 1, 0] } } } },
        { $sort: { count: -1 } }
      ]),
      Notification.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email').lean(),
    ]);

    const openRate  = total > 0 ? Math.round((opened  / total) * 100) : 0;
    const clickRate = total > 0 ? Math.round((clicked / total) * 100) : 0;

    res.json({
      ok: true,
      stats: {
        total, unread, opened, clicked, openRate, clickRate,
        byTone: byTone.map(t => ({
          tone:      t._id || 'info',
          count:     t.count,
          openRate:  t.count > 0 ? Math.round((t.opened  / t.count) * 100) : 0,
          clickRate: t.count > 0 ? Math.round((t.clicked / t.count) * 100) : 0,
        })),
        recent,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT-BASED TRIGGERS
// ─────────────────────────────────────────────────────────────────────────────

export const NotificationHelpers = {

  // Request submitted
  async requestSubmitted(userId, productName) {
    return smartSend(userId, {
      title:   'Order Received',
      message: `We got your order for ${productName}. Our team is reviewing it now.`,
      type:    'info',
    }, { tone: 'event', deepLink: '/dashboard', relatedType: 'request' });
  },

  // Request status changed
  async requestStatusChanged(userId, requestId, status, productName) {
    const map = {
      'Accepted': {
        title:    'Request Approved',
        message:  `Your ${productName} request has been approved. Your key is ready to copy.`,
        type:     'success',
        tone:     'event',
        deepLink: '/dashboard',
      },
      'Rejected': {
        title:    'Request Rejected',
        message:  `Your ${productName} request was rejected. Contact support for details.`,
        type:     'error',
        tone:     'event',
        deepLink: '/dashboard',
      },
      'Pending payment': {
        title:    'Payment Verification',
        message:  `Your ${productName} request is pending payment verification.`,
        type:     'warning',
        tone:     'event',
        deepLink: '/dashboard',
      },
    };
    const cfg = map[status] || {
      title: 'Request Updated', message: `Your ${productName} status: ${status}`, type: 'info', tone: 'event', deepLink: '/dashboard',
    };
    return createNotification(userId, cfg.title, cfg.message, cfg.type, {
      relatedType: 'request', relatedId: requestId, tone: cfg.tone, deepLink: cfg.deepLink,
    });
  },

  // XP gained
  async xpGained(userId, xpAmount, reason = '') {
    return smartSend(userId, {
      title:   'XP Gained',
      message: `You earned ${xpAmount} XP${reason ? '. ' + reason : ''}. Keep going to reach the next rank.`,
      type:    'xp',
    }, { tone: 'reward', deepLink: '/dashboard', relatedType: 'xp', metadata: { xpAmount } });
  },

  // Payment expiry warning (1 hour left)
  async paymentExpiringSoon(userId, productName, minutesLeft) {
    return createNotification(
      userId,
      'Payment Window Closing',
      `${minutesLeft} minutes left to complete payment for ${productName}. After that your order will be cancelled.`,
      'warning',
      { tone: 'urgency', deepLink: '/dashboard', relatedType: 'request' }
    );
  },

  // Inactivity (24h+) — smart roast or gentle nudge
  async inactivityNudge(userId) {
    return smartSend(userId, {
      title:   'You Disappeared',
      message: 'Your XP is waiting. Come back and keep your streak alive before it resets.',
      type:    'info',
    }, { tone: 'roast', deepLink: '/dashboard' });
  },

  // Streak about to break
  async streakWarning(userId, streakCount) {
    return smartSend(userId, {
      title:   `Day ${streakCount} Streak`,
      message: `Do not break it today. One check-in keeps your streak going and your rewards stacking.`,
      type:    'warning',
    }, { tone: 'urgency', deepLink: '/dashboard' });
  },

  // Welcome new user
  async welcomeUser(userId, userName) {
    return createNotification(
      userId,
      'Welcome to SUSANTEDIT',
      `Hi ${userName}. Browse the store, earn XP, and get your first order in minutes.`,
      'success',
      { tone: 'reward', deepLink: '/dashboard', relatedType: 'system' }
    );
  },

  // Wallet credited
  async walletCredited(userId, amount) {
    return smartSend(userId, {
      title:   'Wallet Credited',
      message: `Rs ${amount} has been added to your wallet. Use it on your next order for an instant discount.`,
      type:    'success',
    }, { tone: 'reward', deepLink: '/dashboard' });
  },
};
