import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createRequest, listRequests, markHeartbeat, updateRequestStatus, revokeRequest } from '../controllers/requestController.js';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/couponController.js';
import { login, logout, me, register, verifyEmail, forgotPassword, resetPassword, firebaseSession } from '../controllers/authController.js';
import { requireAuth, requireAdmin, requireVerifiedEmail } from '../middleware/auth.js';
import { getUserNotifications, markNotificationsRead, markAllNotificationsRead, sendCustomNotification, getNotificationStats, trackNotificationClick } from '../controllers/notificationController.js';
import { queueScheduledNotification } from '../lib/scheduler.js';
import User from '../models/User.js';
import AppSettings from '../models/AppSettings.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many authentication attempts' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many account creation attempts' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  limit: 10,                   // 10 AI requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many AI requests. Please wait a moment.' }
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// One-time bootstrap: promote ADMIN_EMAIL to admin on server start
// Set ADMIN_EMAIL=your@gmail.com in server/.env, sign in once, then this fires
router.get('/auth/bootstrap-admin', async (_req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return res.status(400).json({ ok: false, message: 'ADMIN_EMAIL not set in .env' });
  }
  try {
    const { default: User } = await import('../models/User.js');
    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      { role: 'admin' },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: `No account found for ${adminEmail}. Sign in with Google first, then call this endpoint.`
      });
    }
    return res.json({ ok: true, message: `${user.email} promoted to admin` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// Promote any email to admin — only callable by existing admins
router.post('/admin/promote', requireAuth, requireAdmin, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ ok: false, message: 'Email required' });
  try {
    const { default: User } = await import('../models/User.js');
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    return res.json({ ok: true, message: `${user.email} is now admin` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/auth/register', registerLimiter, register);
router.post('/auth/login', authLimiter, login);
router.post('/auth/logout', logout);
router.get('/auth/me', requireAuth, me);
router.get('/auth/verify-email', verifyEmail);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/firebase', authLimiter, firebaseSession);

// ── User profile ──────────────────────────────────────────────────────────
router.patch('/auth/profile', requireAuth, async (req, res) => {
  const { displayName, uid, gameId, tiktok, whatsapp, birthday, avatarUrl } = req.body || {};
  const update = { profile: {} };
  if (displayName !== undefined) update.profile.displayName = String(displayName).trim().slice(0, 80);
  if (uid         !== undefined) update.profile.uid         = String(uid).trim().slice(0, 80);
  if (gameId      !== undefined) update.profile.gameId      = String(gameId).trim().slice(0, 80);
  if (tiktok     !== undefined) update.profile.tiktok       = String(tiktok).trim().slice(0, 80);
  if (whatsapp   !== undefined) update.profile.whatsapp     = String(whatsapp).trim().slice(0, 30);
  if (birthday   !== undefined) update.profile.birthday     = String(birthday).trim().slice(0, 5);
  if (avatarUrl  !== undefined) update.profile.avatarUrl    = String(avatarUrl).trim().slice(0, 300);
  if (displayName !== undefined) update.name = String(displayName).trim().slice(0, 80) || req.user.name;

  try {
    const user = await User.findByIdAndUpdate(req.auth.userId, { $set: update }, { new: true });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    res.json({ ok: true, user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      referralCode: user.referralCode || '',
      couponBalance: Number(user.couponBalance || 0),
      vipExpiresAt: user.vipExpiresAt || null,
      profile: user.profile
    }});
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── App settings (public read, admin write) ───────────────────────────────
async function getOrCreateSettings() {
  let s = await AppSettings.findOne();
  if (!s) s = await AppSettings.create({});
  return s;
}

router.get('/settings', async (_req, res) => {
  try {
    const s = await getOrCreateSettings();
    res.json({ ok: true, settings: s });
  } catch { res.json({ ok: true, settings: {} }); }
});

router.patch('/settings', requireAuth, requireAdmin, async (req, res) => {
  const allowed = ['appName','appTagline','announcement','labels','paymentWindow','contactWhatsApp','contactTelegram','qrEsewa','qrBank'];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  // Limit QR image size to 500KB base64
  if (update.qrEsewa && update.qrEsewa.length > 700000) {
    return res.status(400).json({ ok: false, message: 'eSewa QR image too large (max 500KB)' });
  }
  if (update.qrBank && update.qrBank.length > 700000) {
    return res.status(400).json({ ok: false, message: 'Bank QR image too large (max 500KB)' });
  }
  try {
    let s = await AppSettings.findOne();
    if (!s) s = await AppSettings.create({});
    Object.assign(s, update);
    await s.save();
    res.json({ ok: true, settings: s });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Admin list ────────────────────────────────────────────────────────────
router.get('/admin/list', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email createdAt lastLoginAt').lean();
    res.json({ ok: true, admins });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Demote admin ──────────────────────────────────────────────────────────
router.patch('/admin/demote', requireAuth, requireAdmin, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ ok: false, message: 'Email required' });
  if (email === req.user?.email) return res.status(400).json({ ok: false, message: 'Cannot demote yourself' });
  try {
    const user = await User.findOneAndUpdate({ email }, { role: 'user' }, { new: true });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    res.json({ ok: true, message: `${user.email} demoted to user` });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

router.post('/ping', markHeartbeat);
router.get('/products', listProducts);
router.post('/products', requireAuth, requireAdmin, createProduct);
router.put('/products/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/products/:id', requireAuth, requireAdmin, deleteProduct);
router.get('/requests', requireAuth, listRequests);
router.post('/requests', requireAuth, requireVerifiedEmail, createRequest);
router.patch('/requests/:id/status', requireAuth, requireAdmin, updateRequestStatus);
router.patch('/requests/:id/revoke', requireAuth, requireAdmin, revokeRequest);
router.get('/coupons', requireAuth, requireAdmin, listCoupons);
router.post('/coupons', requireAuth, requireAdmin, createCoupon);
router.patch('/coupons/:id', requireAuth, requireAdmin, updateCoupon);
router.delete('/coupons/:id', requireAuth, requireAdmin, deleteCoupon);

// ── Notifications ─────────────────────────────────────────────────────────
router.get('/notifications', requireAuth, getUserNotifications);
router.patch('/notifications/read', requireAuth, markNotificationsRead);
router.patch('/notifications/read-all', requireAuth, markAllNotificationsRead);
router.patch('/notifications/:id/click', requireAuth, trackNotificationClick);
router.post('/admin/notifications/send', requireAuth, requireAdmin, sendCustomNotification);
router.get('/admin/notifications/stats', requireAuth, requireAdmin, getNotificationStats);

// ── Scheduled notification (admin sets a future send time) ───────────────────
router.post('/admin/notifications/schedule', requireAuth, requireAdmin, (req, res) => {
  try {
    const { title, message, type = 'info', sendAt, targetType = 'all', targetUserId } = req.body || {};
    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ ok: false, message: 'title and message required' });
    }
    if (!sendAt) {
      return res.status(400).json({ ok: false, message: 'sendAt (ISO date string) required' });
    }
    const sendDate = new Date(sendAt);
    if (isNaN(sendDate.getTime()) || sendDate <= new Date()) {
      return res.status(400).json({ ok: false, message: 'sendAt must be a valid future date' });
    }
    queueScheduledNotification({
      title: title.trim(),
      message: message.trim(),
      type,
      sendAt: sendDate,
      targetType,
      targetUserId: targetType === 'specific' ? targetUserId : undefined,
    });
    res.json({ ok: true, message: `Notification scheduled for ${sendDate.toISOString()}` });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Referral System ───────────────────────────────────────────────────────
router.get('/referral/my-code', requireAuth, async (req, res) => {
  try {
    let user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    if (!user.referralCode) {
      // Generate a unique 6-char uppercase code
      let code, exists = true;
      while (exists) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        exists = await User.exists({ referralCode: code });
      }
      user.referralCode = code;
      await user.save();
    }
    res.json({ ok: true, code: user.referralCode });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

router.get('/referral/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('walletBalance referralCount partnerBadge referralCode');
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    res.json({
      ok: true,
      walletBalance: user.walletBalance || 0,
      referralCount: user.referralCount || 0,
      partnerBadge: user.partnerBadge || false,
      referralCode: user.referralCode || ''
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

router.get('/referral/leaderboard', async (_req, res) => {
  try {
    const leaders = await User.find({ referralCount: { $gt: 0 } })
      .sort({ referralCount: -1 })
      .limit(5)
      .select('name referralCount partnerBadge');
    res.json({ ok: true, leaders });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

router.post('/referral/apply', requireAuth, async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ ok: false, message: 'Code required' });

    const applier = await User.findById(req.auth.userId);
    if (!applier) return res.status(404).json({ ok: false, message: 'User not found' });
    if (applier.referredBy) return res.status(400).json({ ok: false, message: 'You have already applied a referral code' });

    const owner = await User.findOne({ referralCode: code });
    if (!owner) return res.status(404).json({ ok: false, message: 'Invalid referral code' });
    if (String(owner._id) === String(applier._id)) {
      return res.status(400).json({ ok: false, message: 'Cannot apply your own referral code' });
    }

    // Credit owner Rs 30 and increment count
    owner.walletBalance = (owner.walletBalance || 0) + 30;
    owner.referralCount = (owner.referralCount || 0) + 1;
    if (owner.referralCount >= 10) owner.partnerBadge = true;
    await owner.save();

    // Mark applier as referred
    applier.referredBy = owner._id;
    await applier.save();

    res.json({ ok: true, message: 'Referral applied! Owner received Rs 30 credit.' });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Hype Meter ────────────────────────────────────────────────────────────
router.get('/hype', async (_req, res) => {
  try {
    const { default: Request } = await import('../models/Request.js');
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const counts = await Request.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $in: ['Accepted', 'Awaiting review', 'Pending payment'] } } },
      { $group: { _id: '$product', count: { $sum: 1 } } }
    ]);
    // Normalize to 0-100 based on max count
    const max = counts.reduce((m, c) => Math.max(m, c.count), 1);
    const hype = {};
    const socialProof = {}; // actual order counts for "X bought today"
    counts.forEach(c => {
      hype[c._id] = Math.round((c.count / max) * 100);
      socialProof[c._id] = c.count;
    });
    res.json({ ok: true, hype, socialProof });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Flash sales stored in memory (simple approach — no extra model needed)
const flashSales = new Map();

router.post('/flash-sale', requireAuth, requireAdmin, (req, res) => {
  try {
    const { productId, productName, discountPercent, endsAt } = req.body || {};
    if (!productId || !discountPercent || !endsAt) {
      return res.status(400).json({ ok: false, message: 'productId, discountPercent, endsAt required' });
    }
    const sale = { productId, productName: productName || productId, discountPercent: Number(discountPercent), endsAt: new Date(endsAt), createdAt: new Date() };
    flashSales.set(String(productId), sale);
    res.json({ ok: true, sale });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

router.get('/flash-sales', (_req, res) => {
  const now = new Date();
  const active = [];
  flashSales.forEach((sale, key) => {
    if (new Date(sale.endsAt) > now) active.push(sale);
    else flashSales.delete(key);
  });
  res.json({ ok: true, sales: active });
});

// ── Admin Analytics ───────────────────────────────────────────────────────
router.get('/admin/analytics', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const { default: Request } = await import('../models/Request.js');

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Revenue by day (last 7 days) — accepted requests only
    const revenueByDay = await Request.aggregate([
      { $match: { status: 'Accepted', updatedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          revenue: { $sum: { $toDouble: '$packagePrice' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const found = revenueByDay.find(r => r._id === key);
      days.push({ date: key, revenue: found?.revenue || 0, count: found?.count || 0 });
    }

    // Top products by order count
    const topProducts = await Request.aggregate([
      { $group: { _id: '$product', count: { $sum: 1 }, revenue: { $sum: { $toDouble: '$packagePrice' } } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Orders by status
    const byStatus = await Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Total users
    const totalUsers = await User.countDocuments();
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });

    // Total revenue & avg order value
    const revenueAgg = await Request.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$packagePrice' } }, count: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const totalOrders = revenueAgg[0]?.count || 0;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Orders this week
    const ordersThisWeek = await Request.countDocuments({ createdAt: { $gte: oneWeekAgo } });

    res.json({
      ok: true,
      revenueByDay: days,
      topProducts,
      byStatus,
      totalUsers,
      newUsersThisWeek,
      totalRevenue,
      avgOrderValue,
      ordersThisWeek
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Gamification: XP & Rank ───────────────────────────────────────────────

// Rank tiers
const RANKS = [
  { name: 'Recruit',  minSpend: 0,     xpBonus: 0,  discount: 0,  color: '#888',    icon: '🪖' },
  { name: 'Soldier',  minSpend: 1000,  xpBonus: 5,  discount: 30, color: '#60a5fa', icon: '⚔️' },
  { name: 'Elite',    minSpend: 5000,  xpBonus: 10, discount: 50, color: '#a78bfa', icon: '💎' },
  { name: 'Legend',   minSpend: 15000, xpBonus: 20, discount: 80, color: '#fbbf24', icon: '👑' },
];

function getRank(totalSpend) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (totalSpend >= r.minSpend) rank = r;
  }
  return rank;
}

function getNextRank(totalSpend) {
  for (const r of RANKS) {
    if (totalSpend < r.minSpend) return r;
  }
  return null;
}

router.get('/gamification/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId)
      .select('xp totalSpend streakCount lastCheckIn walletBalance referralCount partnerBadge lastOrderProduct lastOrderPackage lastOrderPrice name profile');
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const rank = getRank(user.totalSpend || 0);
    const nextRank = getNextRank(user.totalSpend || 0);
    const progressToNext = nextRank
      ? Math.round(((user.totalSpend - rank.minSpend) / (nextRank.minSpend - rank.minSpend)) * 100)
      : 100;

    // Check if streak is still active (last check-in within 48h)
    const now = new Date();
    const lastCI = user.lastCheckIn ? new Date(user.lastCheckIn) : null;
    const hoursSince = lastCI ? (now - lastCI) / 3600000 : 999;
    const canCheckIn = hoursSince >= 20; // allow check-in after 20h
    const streakBroken = hoursSince > 48;
    const currentStreak = streakBroken ? 0 : (user.streakCount || 0);

    res.json({
      ok: true,
      xp: user.xp || 0,
      totalSpend: user.totalSpend || 0,
      rank,
      nextRank,
      progressToNext,
      streakCount: currentStreak,
      canCheckIn,
      walletBalance: user.walletBalance || 0,
      referralCount: user.referralCount || 0,
      partnerBadge: user.partnerBadge || false,
      lastOrder: user.lastOrderProduct ? {
        product: user.lastOrderProduct,
        package: user.lastOrderPackage,
        price: user.lastOrderPrice
      } : null
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Daily check-in
router.post('/gamification/checkin', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const now = new Date();
    const lastCI = user.lastCheckIn ? new Date(user.lastCheckIn) : null;
    const hoursSince = lastCI ? (now - lastCI) / 3600000 : 999;

    if (hoursSince < 20) {
      return res.status(400).json({ ok: false, message: 'Already checked in today. Come back later!' });
    }

    // Streak logic
    const streakBroken = hoursSince > 48;
    const newStreak = streakBroken ? 1 : (user.streakCount || 0) + 1;

    // XP reward: 5 base + 2 per streak day
    const xpGain = 5 + Math.min(newStreak * 2, 20);
    user.xp = (user.xp || 0) + xpGain;
    user.streakCount = newStreak;
    user.lastCheckIn = now;

    // 7-day streak reward: Rs 50 wallet credit
    let reward = null;
    if (newStreak % 7 === 0) {
      user.walletBalance = (user.walletBalance || 0) + 50;
      reward = { type: 'wallet', amount: 50, message: '🎉 7-day streak! Rs 50 added to your wallet!' };
    }
    // 30-day streak reward: Rs 200
    if (newStreak % 30 === 0) {
      user.walletBalance = (user.walletBalance || 0) + 200;
      reward = { type: 'wallet', amount: 200, message: '🏆 30-day streak! Rs 200 added to your wallet!' };
    }

    await user.save();

    res.json({
      ok: true,
      xpGain,
      newStreak,
      totalXp: user.xp,
      reward,
      message: reward ? reward.message : `+${xpGain} XP! Streak: ${newStreak} days 🔥`
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Daily Spin Wheel ──────────────────────────────────────────────────────
// Enforces once per day server-side. Returns prize and records spin time.
router.post('/gamification/spin', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const now = new Date();
    const lastSpin = user.lastSpinAt ? new Date(user.lastSpinAt) : null;

    // Check if already spun today (reset at midnight local — use UTC day boundary)
    if (lastSpin) {
      const hoursSince = (now - lastSpin) / 3600000;
      if (hoursSince < 20) {
        const nextSpin = new Date(lastSpin.getTime() + 20 * 3600000);
        const hoursLeft = Math.ceil((nextSpin - now) / 3600000);
        return res.status(429).json({
          ok: false,
          message: `Already spun today! Come back in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`,
          nextSpinAt: nextSpin
        });
      }
    }

    // Weighted prize selection (matches frontend odds)
    const rand = Math.random();
    let prize;
    if (rand < 1e-43) {
      prize = { label: '🏆 JACKPOT', value: 50, type: 'wallet' };
    } else if (rand < 0.60) {
      prize = { label: 'Try Again', value: 0, type: 'none' };
    } else if (rand < 0.90) {
      prize = { label: '20 XP', value: 20, type: 'xp' };
    } else if (rand < 0.995) {
      prize = { label: '5 XP', value: 5, type: 'xp' };
    } else {
      prize = { label: 'Rs 50 Wallet', value: 50, type: 'wallet' };
    }

    // Apply reward
    user.lastSpinAt = now;
    if (prize.type === 'wallet') {
      user.walletBalance = (user.walletBalance || 0) + prize.value;
    } else if (prize.type === 'xp') {
      user.xp = (user.xp || 0) + prize.value;
    }
    await user.save();

    res.json({ ok: true, prize, walletBalance: user.walletBalance, xp: user.xp });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Birthday wallet credit ────────────────────────────────────────────────
router.post('/gamification/birthday-check', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    const birthday = user.profile?.birthday; // MM-DD
    if (!birthday) return res.json({ ok: false, message: 'No birthday set' });
    const today = new Date();
    const todayMMDD = `${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const lastBdayYear = user.lastBirthdayCredit ? new Date(user.lastBirthdayCredit).getFullYear() : 0;
    if (birthday === todayMMDD && lastBdayYear < today.getFullYear()) {
      user.walletBalance = (user.walletBalance || 0) + 50;
      user.lastBirthdayCredit = new Date();
      await user.save();
      return res.json({ ok: true, gift: true, message: `🎂 Happy Birthday! Rs 50 added to your wallet!` });
    }
    res.json({ ok: true, gift: false });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Reactivation — admin triggers "we miss you" wallet credit ─────────────
router.post('/admin/reactivate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const inactiveDays = Number(req.body?.days || 3);
    const cutoff = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
    const users = await User.find({
      role: 'user',
      $or: [{ lastLoginAt: { $lt: cutoff } }, { lastLoginAt: null }],
      reactivationSentAt: { $not: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    }).limit(100);

    let count = 0;
    for (const u of users) {
      u.walletBalance = (u.walletBalance || 0) + 30;
      u.reactivationSentAt = new Date();
      await u.save();
      count++;
    }
    res.json({ ok: true, message: `Rs 30 wallet credit sent to ${count} inactive users` });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── User Ban System ───────────────────────────────────────────────────────
router.post('/admin/ban', requireAuth, requireAdmin, async (req, res) => {
  const { userId, reason = 'Banned by admin' } = req.body || {};
  if (!userId) return res.status(400).json({ ok: false, message: 'userId required' });
  try {
    const user = await User.findByIdAndUpdate(userId, {
      isBanned: true, banReason: String(reason).trim().slice(0, 200), bannedAt: new Date()
    }, { new: true });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    res.json({ ok: true, message: `${user.email} has been banned` });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

router.post('/admin/unban', requireAuth, requireAdmin, async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ ok: false, message: 'userId required' });
  try {
    const user = await User.findByIdAndUpdate(userId, {
      isBanned: false, banReason: '', bannedAt: null
    }, { new: true });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    res.json({ ok: true, message: `${user.email} has been unbanned` });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Delete Order (admin only) ─────────────────────────────────────────────
router.delete('/requests/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { default: Request } = await import('../models/Request.js');
    const request = await Request.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ ok: false, message: 'Request not found' });
    res.json({ ok: true, message: 'Order deleted' });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Order Chat (user ↔ admin) ─────────────────────────────────────────────
// Get messages for an order
router.get('/requests/:id/messages', requireAuth, async (req, res) => {
  try {
    const { default: Request } = await import('../models/Request.js');
    const request = await Request.findById(req.params.id).select('messages userId').lean();
    if (!request) return res.status(404).json({ ok: false, message: 'Not found' });
    // Only owner or admin can read
    const isAdmin = req.auth?.role === 'admin';
    const isOwner = String(request.userId) === String(req.auth?.userId);
    if (!isAdmin && !isOwner) return res.status(403).json({ ok: false, message: 'Forbidden' });
    res.json({ ok: true, messages: request.messages || [] });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// Post a message on an order
router.post('/requests/:id/messages', requireAuth, async (req, res) => {
  const text = String(req.body?.text || '').trim().slice(0, 500);
  if (!text) return res.status(400).json({ ok: false, message: 'Message text required' });
  try {
    const { default: Request } = await import('../models/Request.js');
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ ok: false, message: 'Not found' });
    const isAdmin = req.auth?.role === 'admin';
    const isOwner = String(request.userId) === String(req.auth?.userId);
    if (!isAdmin && !isOwner) return res.status(403).json({ ok: false, message: 'Forbidden' });
    const from = isAdmin ? 'admin' : 'user';
    request.messages = request.messages || [];
    request.messages.push({ from, text, createdAt: new Date() });
    await request.save();
    // Notify the other party
    if (from === 'admin') {
      const { NotificationHelpers } = await import('../controllers/notificationController.js');
      await NotificationHelpers.showNotification(request.userId, '💬 Admin replied', `Re: ${request.product} — ${text.slice(0, 60)}`, 'info').catch(() => {});
    }
    res.json({ ok: true, message: request.messages[request.messages.length - 1] });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── AI Chat proxy (Gemini) ────────────────────────────────────────────────
// Keeps the API key server-side — never exposed to the browser.
// POST /api/ai/chat  { messages: [{role, content}], system: string }
router.post('/ai/chat', aiLimiter, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ ok: false, message: 'AI not configured. Add GEMINI_API_KEY to server/.env' });
  }

  const { messages = [], system = '' } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ ok: false, message: 'messages array required' });
  }

  // Validate message content
  if (messages.length > 20) {
    return res.status(400).json({ ok: false, message: 'Too many messages in history' });
  }
  for (const m of messages) {
    if (!['user', 'assistant', 'model'].includes(m.role)) {
      return res.status(400).json({ ok: false, message: 'Invalid message role' });
    }
    if (typeof m.content !== 'string' || m.content.length > 2000) {
      return res.status(400).json({ ok: false, message: 'Message content too long (max 2000 chars)' });
    }
  }
  if (system && system.length > 10000) {
    return res.status(400).json({ ok: false, message: 'System prompt too long' });
  }

  // Build Gemini contents array
  // Gemini uses "user" / "model" roles (not "assistant")
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }]
  }));

  const body = {
    system_instruction: system ? { parts: [{ text: system }] } : undefined,
    contents,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    }
  };

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[gemini-error]', geminiRes.status, errText);
      // Parse Gemini error for a useful message
      let userMsg = 'AI service error. Try again.';
      try {
        const errJson = JSON.parse(errText);
        const reason = errJson?.error?.message || '';
        if (reason.includes('API_KEY_INVALID') || reason.includes('API key not valid')) {
          userMsg = 'Invalid Gemini API key. Update GEMINI_API_KEY in server/.env';
        } else if (reason.includes('quota') || reason.includes('RESOURCE_EXHAUSTED')) {
          userMsg = 'Gemini quota exceeded. Try again later.';
        } else if (reason.includes('not found') || reason.includes('404')) {
          userMsg = 'Gemini model not found. Check model name.';
        } else if (reason) {
          userMsg = reason.slice(0, 120);
        }
      } catch {}
      return res.status(502).json({ ok: false, message: userMsg });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ ok: true, text });
  } catch (e) {
    console.error('[gemini-fetch-error]', e.message);
    res.status(502).json({ ok: false, message: 'AI request failed. Try again.' });
  }
});

// ── VIP Subscription ─────────────────────────────────────────────────────

router.get('/vip/status', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('vipExpiresAt name email');
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    const isVip = user.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();
    res.json({ ok: true, isVip: !!isVip, vipExpiresAt: user.vipExpiresAt || null });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Admin grants VIP (after manual payment verification)
router.post('/vip/grant', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, months = 1 } = req.body || {};
    if (!userId) return res.status(400).json({ ok: false, message: 'userId required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const now = new Date();
    const currentExpiry = user.vipExpiresAt && new Date(user.vipExpiresAt) > now
      ? new Date(user.vipExpiresAt)
      : now;
    const newExpiry = new Date(currentExpiry.getTime() + Number(months) * 30 * 24 * 60 * 60 * 1000);
    user.vipExpiresAt = newExpiry;
    await user.save();

    res.json({ ok: true, message: `VIP granted for ${months} month(s)`, vipExpiresAt: newExpiry });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// User requests VIP (submits payment proof — admin reviews and grants)
router.post('/vip/request', requireAuth, async (req, res) => {
  try {
    const { transaction, paymentMethod = 'esewa' } = req.body || {};
    if (!transaction) return res.status(400).json({ ok: false, message: 'Transaction number required' });

    const { default: Request } = await import('../models/Request.js');
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    // Create a special VIP request for admin to review
    const vipReq = await Request.create({
      userId: req.auth.userId,
      userName: user.name,
      tikTok: user.profile?.tiktok || '',
      whatsApp: user.profile?.whatsapp || '',
      product: '⭐ VIP Subscription',
      packageName: '1 Month — Ad-Free',
      packagePrice: '199',
      transaction,
      paymentMethod,
      status: 'Pending payment',
      requestId: `VIP-${Date.now()}`
    });

    res.json({ ok: true, message: 'VIP request submitted! Admin will verify and activate within 30 minutes.', requestId: vipReq.requestId });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Admin list of users for VIP management
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const search = String(req.query.search || '').trim();
    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};
    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email role vipExpiresAt walletBalance totalSpend createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);
    res.json({ ok: true, users, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Gift to Friends ───────────────────────────────────────────────────────
// Sender picks a product + package, pays for it, admin delivers key to recipient

router.post('/gifts/send', requireAuth, async (req, res) => {
  try {
    const { recipientEmail, product, packageName, packagePrice, transaction, paymentMethod = 'esewa', message = '' } = req.body || {};
    if (!recipientEmail || !product || !packageName || !packagePrice || !transaction) {
      return res.status(400).json({ ok: false, message: 'recipientEmail, product, packageName, packagePrice, transaction required' });
    }

    // Strict field length limits
    if (String(recipientEmail).length > 254) return res.status(400).json({ ok: false, message: 'Invalid email' });
    if (String(product).length > 100) return res.status(400).json({ ok: false, message: 'Invalid product name' });
    if (String(packageName).length > 100) return res.status(400).json({ ok: false, message: 'Invalid package name' });
    if (String(transaction).length > 100) return res.status(400).json({ ok: false, message: 'Invalid transaction number' });
    const cleanMessage = String(message || '').replace(/<[^>]*>/g, '').slice(0, 200); // strip HTML tags

    const sender = await User.findById(req.auth.userId);
    if (!sender) return res.status(404).json({ ok: false, message: 'Sender not found' });

    const recipient = await User.findOne({ email: String(recipientEmail).trim().toLowerCase() });
    if (!recipient) return res.status(404).json({ ok: false, message: 'No account found with that email. They must be registered on SUSANTEDIT.' });
    if (String(recipient._id) === String(sender._id)) {
      return res.status(400).json({ ok: false, message: 'You cannot gift yourself.' });
    }

    const { default: Request } = await import('../models/Request.js');
    const giftReq = await Request.create({
      userId: recipient._id,
      userName: recipient.name,
      tikTok: recipient.profile?.tiktok || '',
      whatsapp: recipient.profile?.whatsapp || '',
      transaction,
      product,
      packageName,
      packagePrice: String(packagePrice),
      paymentMethod,
      status: 'Awaiting review',
      notes: '',
      // Store gift metadata in a note prefix
      giftFrom: sender.name,
      giftMessage: cleanMessage,
      isGift: true,
    });

    res.json({ ok: true, message: `Gift sent to ${recipient.name}! Admin will deliver the key to them.`, requestId: giftReq._id });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

router.get('/gifts/sent', requireAuth, async (req, res) => {
  try {
    const { default: Request } = await import('../models/Request.js');
    // Gifts sent BY this user = requests where giftFrom matches their name and isGift=true
    // We store sender userId separately for clean lookup
    const gifts = await Request.find({ giftSenderId: req.auth.userId }).sort({ createdAt: -1 }).limit(20).lean();
    res.json({ ok: true, gifts });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── Web Push (VAPID) — subscribe / unsubscribe / test ────────────────────────
router.get('/push/vapid-public-key', (_req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(503).json({ ok: false, message: 'Push not configured' });
  res.json({ ok: true, publicKey: key });
});

router.post('/push/subscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ ok: false, message: 'Invalid subscription object' });
    }
    // Remove old entry for same endpoint, then add fresh
    await User.findByIdAndUpdate(req.auth.userId, {
      $pull: { pushSubscriptions: { endpoint } }
    });
    await User.findByIdAndUpdate(req.auth.userId, {
      $push: { pushSubscriptions: { $each: [{ endpoint, keys }], $slice: -5 } }
    });
    res.json({ ok: true, message: 'Subscribed' });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

router.post('/push/unsubscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (endpoint) {
      await User.findByIdAndUpdate(req.auth.userId, {
        $pull: { pushSubscriptions: { endpoint } }
      });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Test endpoint — send push to a raw subscription object (no auth needed for local testing)
router.post('/push/test', async (req, res) => {
  try {
    const { subscription, title = 'Test Push', body = 'Web Push is working!' } = req.body || {};
    if (!subscription?.endpoint) {
      return res.status(400).json({ ok: false, message: 'subscription required' });
    }
    const { sendPushToSubscription } = await import('../lib/webpush.js');
    const result = await sendPushToSubscription(subscription, title, body, { url: '/dashboard' });
    if (result === true)       return res.json({ ok: true,  message: 'Push sent!' });
    if (result === 'expired')  return res.json({ ok: false, message: 'Subscription expired' });
    return res.json({ ok: false, message: 'Push failed — check server logs' });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// FCM token (legacy — kept for backward compat)
router.post('/push/register', requireAuth, async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    if (!token) return res.status(400).json({ ok: false, message: 'token required' });
    await User.findByIdAndUpdate(req.auth.userId, { $addToSet: { fcmTokens: token } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ── VIP Revoke ────────────────────────────────────────────────────────────
router.post('/vip/revoke', requireAuth, requireAdmin, async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ ok: false, message: 'userId required' });
  try {
    const user = await User.findByIdAndUpdate(userId, { vipExpiresAt: null }, { new: true });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    res.json({ ok: true, message: `VIP revoked for ${user.email}` });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Product Ratings ───────────────────────────────────────────────────────
router.post('/products/:id/rate', requireAuth, async (req, res) => {
  const { stars, comment = '' } = req.body || {};
  if (!stars || stars < 1 || stars > 5) return res.status(400).json({ ok: false, message: 'stars must be 1-5' });
  try {
    const { default: Product } = await import('../models/Product.js');
    const { default: Request } = await import('../models/Request.js');
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ ok: false, message: 'Product not found' });
    // Only users who have an accepted order for this product can rate
    const hasOrder = await Request.exists({ userId: req.auth.userId, product: product.name, status: 'Accepted' });
    if (!hasOrder) return res.status(403).json({ ok: false, message: 'You can only rate products you have purchased' });
    // Remove existing rating from this user
    product.ratings = (product.ratings || []).filter(r => String(r.userId) !== String(req.auth.userId));
    product.ratings.push({ userId: req.auth.userId, userName: req.user?.name || 'User', stars: Number(stars), comment: String(comment).trim().slice(0, 300) });
    // Recalculate avg
    const total = product.ratings.reduce((s, r) => s + r.stars, 0);
    product.avgRating = Math.round((total / product.ratings.length) * 10) / 10;
    product.ratingCount = product.ratings.length;
    await product.save();
    res.json({ ok: true, avgRating: product.avgRating, ratingCount: product.ratingCount });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

router.get('/products/:id/ratings', async (req, res) => {
  try {
    const { default: Product } = await import('../models/Product.js');
    const product = await Product.findById(req.params.id).select('ratings avgRating ratingCount name').lean();
    if (!product) return res.status(404).json({ ok: false, message: 'Not found' });
    res.json({ ok: true, ratings: product.ratings || [], avgRating: product.avgRating || 0, ratingCount: product.ratingCount || 0 });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Product View Tracking (conversion funnel) ─────────────────────────────
router.post('/products/:id/view', async (req, res) => {
  try {
    const { default: Product } = await import('../models/Product.js');
    await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});

// ── CSV Export ────────────────────────────────────────────────────────────
router.get('/admin/export/orders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { default: Request } = await import('../models/Request.js');
    const orders = await Request.find({}).sort({ createdAt: -1 }).lean();
    const headers = ['ID','User','Product','Package','Price','Payment','Status','TikTok','WhatsApp','Transaction','Date'];
    const rows = orders.map(o => [
      String(o._id),
      o.userName || '',
      o.product || '',
      o.packageName || '',
      o.packagePrice || '',
      o.paymentMethod || '',
      o.status || '',
      o.tikTok || '',
      o.whatsapp || '',
      o.transaction || '',
      o.createdAt ? new Date(o.createdAt).toISOString().slice(0,10) : ''
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── User Lifetime Value (admin) ───────────────────────────────────────────
router.get('/admin/user-ltv', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { default: Request } = await import('../models/Request.js');
    const ltv = await Request.aggregate([
      { $match: { status: 'Accepted' } },
      { $group: { _id: '$userId', totalSpend: { $sum: { $toDouble: '$packagePrice' } }, orderCount: { $sum: 1 }, lastOrder: { $max: '$createdAt' } } },
      { $sort: { totalSpend: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmpty: true } },
      { $project: { name: '$user.name', email: '$user.email', totalSpend: 1, orderCount: 1, lastOrder: 1 } }
    ]);
    res.json({ ok: true, ltv });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Suspicious Order Detection ────────────────────────────────────────────
router.get('/admin/suspicious', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { default: Request } = await import('../models/Request.js');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    // Find IPs or WhatsApp numbers with 3+ orders in last hour
    const recentOrders = await Request.find({ createdAt: { $gte: oneHourAgo } }).lean();
    const ipCounts = {}, waCounts = {};
    recentOrders.forEach(o => {
      if (o.ip) ipCounts[o.ip] = (ipCounts[o.ip] || 0) + 1;
      if (o.whatsapp) waCounts[o.whatsapp] = (waCounts[o.whatsapp] || 0) + 1;
    });
    const suspicious = recentOrders.filter(o =>
      (o.ip && ipCounts[o.ip] >= 3) || (o.whatsapp && waCounts[o.whatsapp] >= 3)
    );
    res.json({ ok: true, suspicious, count: suspicious.length });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Conversion Funnel ─────────────────────────────────────────────────────
router.get('/admin/funnel', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { default: Product } = await import('../models/Product.js');
    const { default: Request } = await import('../models/Request.js');
    const products = await Product.find({}).select('name viewCount orderCount avgRating ratingCount').lean();
    // Enrich with actual order counts from requests
    const orderCounts = await Request.aggregate([
      { $group: { _id: '$product', orders: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ['$status','Accepted'] }, 1, 0] } } } }
    ]);
    const orderMap = {};
    orderCounts.forEach(o => { orderMap[o._id] = { orders: o.orders, accepted: o.accepted }; });
    const funnel = products.map(p => {
      const oc = orderMap[p.name] || { orders: 0, accepted: 0 };
      const views = p.viewCount || 0;
      const convRate = views > 0 ? Math.round((oc.orders / views) * 100) : 0;
      return { name: p.name, views, orders: oc.orders, accepted: oc.accepted, convRate, avgRating: p.avgRating || 0, ratingCount: p.ratingCount || 0 };
    }).sort((a, b) => b.orders - a.orders);
    res.json({ ok: true, funnel });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Admin User Notes ──────────────────────────────────────────────────────
router.patch('/admin/users/:id/notes', requireAuth, requireAdmin, async (req, res) => {
  const notes = String(req.body?.notes || '').trim().slice(0, 1000);
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { adminNotes: notes }, { new: true }).select('name email adminNotes');
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    res.json({ ok: true, adminNotes: user.adminNotes });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Avatar Upload (base64, max 200KB) ─────────────────────────────────────
router.patch('/auth/avatar', requireAuth, async (req, res) => {
  const { avatarUrl } = req.body || {};
  if (!avatarUrl) return res.status(400).json({ ok: false, message: 'avatarUrl required' });
  if (avatarUrl.length > 280000) return res.status(400).json({ ok: false, message: 'Image too large (max ~200KB)' });
  try {
    await User.findByIdAndUpdate(req.auth.userId, { 'profile.avatarUrl': avatarUrl });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Abandoned Checkout Recovery ───────────────────────────────────────────
// Called when user opens buy modal — stores timestamp. If no order in 30min, notify.
router.post('/checkout/start', requireAuth, async (req, res) => {
  const { product, packageName } = req.body || {};
  try {
    await User.findByIdAndUpdate(req.auth.userId, {
      'profile.abandonedProduct': String(product || '').slice(0, 100),
      'profile.abandonedPackage': String(packageName || '').slice(0, 100),
      'profile.abandonedAt': new Date()
    });
    res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});

// Admin trigger: send recovery notifications to users who abandoned checkout 30+ min ago
router.post('/admin/send-abandoned-recovery', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { NotificationHelpers } = await import('../controllers/notificationController.js');
    const { default: Request } = await import('../models/Request.js');
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    // Find users who started checkout but didn't complete (no recent order)
    const users = await User.find({
      'profile.abandonedAt': { $lt: thirtyMinAgo, $gt: twoHoursAgo },
      'profile.abandonedProduct': { $exists: true, $ne: '' }
    }).select('_id profile').lean();
    let sent = 0;
    for (const u of users) {
      // Check if they actually placed an order after abandoning
      const ordered = await Request.exists({
        userId: u._id,
        product: u.profile.abandonedProduct,
        createdAt: { $gt: new Date(u.profile.abandonedAt) }
      });
      if (ordered) continue;
      await NotificationHelpers.showNotification(
        u._id,
        '🛒 You left something behind!',
        `Your ${u.profile.abandonedProduct} is still available. Complete your order before it sells out!`,
        'warning'
      ).catch(() => {});
      // Clear abandoned state
      await User.findByIdAndUpdate(u._id, { 'profile.abandonedProduct': '', 'profile.abandonedAt': null });
      sent++;
    }
    res.json({ ok: true, message: `Recovery notifications sent to ${sent} users` });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Wishlist ──────────────────────────────────────────────────────────────
router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select('wishlist');
    res.json({ ok: true, wishlist: user?.wishlist || [] });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

router.post('/wishlist/toggle', requireAuth, async (req, res) => {
  const productName = String(req.body?.productName || '').trim();
  if (!productName) return res.status(400).json({ ok: false, message: 'productName required' });
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    const idx = user.wishlist.indexOf(productName);
    let added = false;
    if (idx === -1) { user.wishlist.push(productName); added = true; }
    else { user.wishlist.splice(idx, 1); added = false; }
    await user.save();
    res.json({ ok: true, added, wishlist: user.wishlist });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Product Sort Order (admin reorder) ────────────────────────────────────
router.patch('/products/reorder', requireAuth, requireAdmin, async (req, res) => {
  // body: { order: ['id1','id2','id3',...] }
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ ok: false, message: 'order array required' });
  try {
    const { default: Product } = await import('../models/Product.js');
    await Promise.all(order.map((id, i) => Product.findByIdAndUpdate(id, { sortOrder: i })));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Duplicate Transaction Check ───────────────────────────────────────────
router.get('/requests/check-duplicate', requireAuth, async (req, res) => {
  const txn = String(req.query.transaction || '').trim();
  if (!txn) return res.json({ ok: true, duplicate: false });
  try {
    const { default: Request } = await import('../models/Request.js');
    const existing = await Request.findOne({ transaction: txn }).select('userName product createdAt').lean();
    if (existing) return res.json({ ok: true, duplicate: true, existing });
    res.json({ ok: true, duplicate: false });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

// ── Subscription Renewal Reminder (admin trigger or cron) ─────────────────
router.post('/admin/send-renewal-reminders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { default: Request } = await import('../models/Request.js');
    const { NotificationHelpers } = await import('../controllers/notificationController.js');
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Find accepted orders where expiryTime is within 3 days and reminder not sent recently
    const expiringOrders = await Request.find({
      status: 'Accepted',
      expiryTime: { $gt: new Date(), $lt: threeDaysFromNow }
    }).lean();
    let sent = 0;
    for (const order of expiringOrders) {
      const user = await User.findById(order.userId).select('renewalReminderSentAt');
      if (!user) continue;
      const lastSent = user.renewalReminderSentAt?.get?.(order.product);
      if (lastSent && new Date(lastSent) > oneDayAgo) continue; // already sent today
      await NotificationHelpers.showNotification(
        order.userId,
        '⏰ Access Expiring Soon!',
        `Your ${order.product} access expires in less than 3 days. Renew now to keep access!`,
        'warning'
      ).catch(() => {});
      if (!user.renewalReminderSentAt) user.renewalReminderSentAt = new Map();
      user.renewalReminderSentAt.set(order.product, new Date());
      await user.save();
      sent++;
    }
    res.json({ ok: true, message: `Renewal reminders sent to ${sent} users` });
  } catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

export default router;
