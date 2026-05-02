import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Create notification helper
export async function createNotification(userId, title, message, type = 'info', options = {}) {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      fromAdmin: options.fromAdmin || false,
      adminId: options.adminId || null,
      relatedType: options.relatedType || 'system',
      relatedId: options.relatedId || null,
      metadata: options.metadata || {}
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

// Get user notifications
export async function getUserNotifications(req, res) {
  try {
    const userId = req.auth?.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const unreadOnly = req.query.unread === 'true';

    const query = { userId };
    if (unreadOnly) query.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, read: false })
    ]);

    res.json({
      ok: true,
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

// Mark notifications as read
export async function markNotificationsRead(req, res) {
  try {
    const userId = req.auth?.userId;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ ok: false, message: 'notificationIds array required' });
    }

    const result = await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        userId,
        read: false
      },
      { 
        read: true,
        readAt: new Date()
      }
    );

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.auth?.userId;

    const result = await Notification.updateMany(
      { userId, read: false },
      { 
        read: true,
        readAt: new Date()
      }
    );

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

// Admin: Send custom notification
export async function sendCustomNotification(req, res) {
  try {
    const { targetType, targetUserId, title, message, type = 'info' } = req.body;
    const adminId = req.auth?.userId;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ ok: false, message: 'Title and message are required' });
    }

    if (!['specific', 'all'].includes(targetType)) {
      return res.status(400).json({ ok: false, message: 'targetType must be "specific" or "all"' });
    }

    let targetUsers = [];

    if (targetType === 'specific') {
      if (!targetUserId) {
        return res.status(400).json({ ok: false, message: 'targetUserId required for specific notifications' });
      }
      const user = await User.findById(targetUserId);
      if (!user) {
        return res.status(404).json({ ok: false, message: 'Target user not found' });
      }
      targetUsers = [user];
    } else {
      // Broadcast to all users
      targetUsers = await User.find({ role: 'user' }).select('_id').limit(1000);
    }

    // Create notifications for all target users
    const notifications = await Promise.all(
      targetUsers.map(user => 
        createNotification(
          user._id,
          title.trim(),
          message.trim(),
          type,
          {
            fromAdmin: true,
            adminId,
            relatedType: 'custom'
          }
        )
      )
    );

    const successCount = notifications.filter(n => n !== null).length;

    res.json({
      ok: true,
      message: `Notification sent to ${successCount} user${successCount !== 1 ? 's' : ''}`,
      sentCount: successCount
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

// Admin: Get notification stats
export async function getNotificationStats(req, res) {
  try {
    const [totalNotifications, unreadNotifications, recentNotifications] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ read: false }),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .lean()
    ]);

    res.json({
      ok: true,
      stats: {
        total: totalNotifications,
        unread: unreadNotifications,
        recent: recentNotifications
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
}

// Notification helpers for system events
export const NotificationHelpers = {
  // XP gained notification
  async xpGained(userId, xpAmount, reason = 'Activity completed') {
    return createNotification(
      userId,
      '🎯 XP Gained!',
      `You earned ${xpAmount} XP! ${reason}`,
      'xp',
      { relatedType: 'xp', metadata: { xpAmount, reason } }
    );
  },

  // Request status change notification
  async requestStatusChanged(userId, requestId, status, productName) {
    const statusMessages = {
      'Accepted': {
        title: '🔑 Request Approved!',
        message: `Your ${productName} request has been approved! Your key is ready.`,
        type: 'success'
      },
      'Rejected': {
        title: '❌ Request Rejected',
        message: `Your ${productName} request was rejected. Contact support for details.`,
        type: 'error'
      },
      'Pending payment': {
        title: '⏳ Payment Verification',
        message: `Your ${productName} request is pending payment verification.`,
        type: 'warning'
      }
    };

    const config = statusMessages[status] || {
      title: 'Request Updated',
      message: `Your ${productName} request status: ${status}`,
      type: 'info'
    };

    return createNotification(
      userId,
      config.title,
      config.message,
      config.type,
      { relatedType: 'request', relatedId: requestId }
    );
  },

  // Welcome notification for new users
  async welcomeUser(userId, userName) {
    return createNotification(
      userId,
      '🎉 Welcome to SUSANTEDIT!',
      `Hi ${userName}! Welcome to the best gaming service in Nepal. Start by browsing our products and earning XP!`,
      'success',
      { relatedType: 'system' }
    );
  }
};