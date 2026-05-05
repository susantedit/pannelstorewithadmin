import Request from '../models/Request.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { resolveCouponCode } from './couponController.js';
import { NotificationHelpers } from './notificationController.js';
import { sendDiscordAlert, sendStatusAlert } from '../lib/alerts.js';

const inMemoryRequests = [
  {
    id: 'req-1001',
    userId: 'user-1001',
    userName: 'Aarav',
    tikTok: '@aarav',
    whatsapp: '+977-98XXXXXXXX',
    transaction: 'TRX-9182',
    product: 'Prime Access',
    paymentMethod: 'bank',
    status: 'Awaiting review',
    updatedAt: new Date().toISOString()
  }
];

export async function listRequests(req, res) {
  const shouldUseDb = Request.db && Request.db.readyState === 1;
  const isAdmin = req.auth?.role === 'admin';
  const userId = req.auth?.userId;
  const scope = String(req.query?.scope || 'mine').toLowerCase();
  const allowAll = isAdmin && scope === 'all';

  if (!shouldUseDb) {
    const requests = allowAll ? inMemoryRequests : inMemoryRequests.filter((request) => String(request.userId) === String(userId));
    return res.json({ ok: true, requests });
  }

  const query = allowAll ? {} : { userId };
  const requests = await Request.find(query).sort({ createdAt: -1 }).lean();
  res.json({ ok: true, requests });
}

export async function createRequest(req, res) {
  const payload = req.body || {};
  const userId = req.auth?.userId;
  const userName = String(req.user?.name || payload.userName || '').trim();
  const tikTok = String(payload.tikTok || '').trim();
  const whatsapp = String(payload.whatsApp || payload.whatsapp || '').trim();
  const transaction = String(payload.transaction || '').trim();
  const product = String(payload.product || '').trim();
  const packageName = String(payload.packageName || '').trim();
  const packagePrice = String(payload.packagePrice || '').trim();
  const couponCode = String(payload.couponCode || '').trim().toUpperCase();
  const paymentMethod = payload.paymentMethod === 'esewa' ? 'esewa' : 'bank';
  const basePrice = Number(String(packagePrice).replace(/[^0-9.]/g, '')) || 0;
  let couponType = '';
  let couponDiscountKind = '';
  let couponDiscountValue = 0;
  let discountAmount = 0;
  let couponOwnerId = null;
  let referralRewardAmount = 0;
  let finalPrice = basePrice;

  if (!userId) {
    return res.status(401).json({ ok: false, message: 'Authentication required' });
  }

  if (!userName || !product || !tikTok || !whatsapp || !transaction) {
    return res.status(400).json({ ok: false, message: 'All request fields are required' });
  }

  // Check if user is banned
  if (req.user?.isBanned) {
    return res.status(403).json({ ok: false, message: 'Your account has been suspended. Contact support.' });
  }

  const shouldUseDb = Request.db && Request.db.readyState === 1;

  // Duplicate transaction check
  if (transaction && shouldUseDb) {
    const existing = await Request.findOne({ transaction }).select('userName product').lean();
    if (existing) {
      return res.status(400).json({
        ok: false,
        message: `⚠️ Duplicate transaction ID! This transaction was already used by ${existing.userName} for ${existing.product}. If this is a mistake, contact support.`,
        duplicate: true
      });
    }
  }

  if (couponCode) {
    const coupon = await resolveCouponCode(couponCode);
    if (!coupon) {
      return res.status(400).json({ ok: false, message: 'Invalid or expired coupon code' });
    }
    couponType = coupon.type || '';
    couponDiscountKind = coupon.discountKind || 'flat';
    couponDiscountValue = Number(coupon.discountValue ?? coupon.discountAmount ?? 30);
    if (couponDiscountKind === 'percent') {
      discountAmount = Math.round((basePrice * couponDiscountValue) / 100);
    } else {
      discountAmount = couponDiscountValue;
    }
    discountAmount = Math.min(Math.max(discountAmount, 0), basePrice || discountAmount);
    finalPrice = Math.max(basePrice - discountAmount, 0);
    couponOwnerId = coupon.ownerUserId || null;
    referralRewardAmount = Number(coupon.rewardAmount ?? 30);
  } else if (shouldUseDb && Number(req.user?.couponBalance || 0) > 0) {
    discountAmount = Math.min(Number(req.user.couponBalance || 0), basePrice);
    finalPrice = Math.max(basePrice - discountAmount, 0);
    await User.findByIdAndUpdate(userId, { $inc: { couponBalance: -discountAmount } });
  }

  const requestData = {
    userId,
    userName,
    tikTok,
    whatsapp,
    transaction,
    product,
    packageName,
    packagePrice,
    couponCode: couponCode || '',
    couponType,
    couponDiscountKind,
    couponDiscountValue,
    discountAmount,
    finalPrice,
    couponOwnerId,
    referralRewardAmount,
    couponRewardedAt: null,
    paymentMethod,
    status: 'Awaiting review',
    expiryTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    ip: (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || req.socket?.remoteAddress || '').slice(0, 60)
  };

  if (!shouldUseDb) {
    const request = {
      id: `req-${Date.now()}`,
      ...requestData,
      updatedAt: new Date().toISOString()
    };
    inMemoryRequests.unshift(request);
    return res.status(201).json({ ok: true, request });
  }

  const request = await Request.create(requestData);
  
  // Award XP for request submission (5 XP base)
  await awardXpForPurchase(userId, 0, 5);

  // Increment product order count for conversion funnel
  try {
    const { default: Product } = await import('../models/Product.js');
    await Product.findOneAndUpdate({ name: product }, { $inc: { orderCount: 1 } });
  } catch {}
  
  // Send in-app notification to user
  await NotificationHelpers.xpGained(userId, 5, 'Request submitted');

  // Discord/Telegram alert to admin — non-blocking, rich embed
  const userEmail = req.user?.email || '';
  const userIp = (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );

  sendDiscordAlert({
    userName,
    product,
    packageName,
    price:         finalPrice || basePrice,
    paymentMethod,
    tikTok,
    whatsapp,
    transaction,
    email:         userEmail,
    ip:            userIp,
  }).catch(() => {});
  
  res.status(201).json({ ok: true, request });
}

export async function updateRequestStatus(req, res) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }

  const { id } = req.params;
  const status = String(req.body?.status || '').trim();
  const notes = String(req.body?.notes || '').trim();

  if (!id) {
    return res.status(400).json({ ok: false, message: 'Request id is required' });
  }

  if (!['Accepted', 'Rejected', 'Awaiting review', 'Pending payment'].includes(status)) {
    return res.status(400).json({ ok: false, message: 'Invalid status' });
  }

  const shouldUseDb = Request.db && Request.db.readyState === 1;

  if (!shouldUseDb) {
    const request = inMemoryRequests.find((entry) => entry.id === id);
    if (!request) {
      return res.status(404).json({ ok: false, message: 'Request not found' });
    }

    request.status = status;
    request.notes = notes;
    request.updatedAt = new Date().toISOString();
    return res.json({ ok: true, request });
  }

  const request = await Request.findById(id);

  if (!request) {
    return res.status(404).json({ ok: false, message: 'Request not found' });
  }

  // ── Payment Window Validation (2 hours from order creation) ──
  if (status === 'Accepted') {
    const now = new Date();
    
    // Check if order has expired (using stored expiryTime if available)
    if (request.expiryTime && now > new Date(request.expiryTime)) {
      const createdAt = new Date(request.createdAt);
      const diffHours = (now - createdAt) / (1000 * 60 * 60);
      return res.status(400).json({ 
        ok: false, 
        message: `Payment time expired. This order was created ${diffHours.toFixed(1)} hours ago. Payment must be completed within 2 hours of order creation.` 
      });
    }
    
    // Fallback: check createdAt if expiryTime is not set (for old orders)
    if (!request.expiryTime) {
      const createdAt = new Date(request.createdAt);
      const diffHours = (now - createdAt) / (1000 * 60 * 60);
      
      if (diffHours > 2) {
        return res.status(400).json({ 
          ok: false, 
          message: `Payment time expired. This order was created ${diffHours.toFixed(1)} hours ago. Payment must be completed within 2 hours of order creation.` 
        });
      }
    }
  }

  request.status = status;
  request.notes = notes;

  // ── Auto-grant VIP when a VIP subscription request is accepted ──
  if (status === 'Accepted' && request.product === '⭐ VIP Subscription') {
    const months = 1; // always 1 month per VIP request
    const user = await User.findById(request.userId);
    if (user) {
      const now = new Date();
      const currentExpiry = user.vipExpiresAt && new Date(user.vipExpiresAt) > now
        ? new Date(user.vipExpiresAt)
        : now;
      user.vipExpiresAt = new Date(currentExpiry.getTime() + months * 30 * 24 * 60 * 60 * 1000);
      await user.save();
    }
  }

  // ── Award XP and send notifications when request is accepted ──
  if (status === 'Accepted') {
    const packagePrice = parseFloat(request.packagePrice) || 0;
    await awardXpForPurchase(request.userId, packagePrice);
    
    // Send notifications
    await NotificationHelpers.requestStatusChanged(
      request.userId, 
      request._id, 
      status, 
      request.product
    );
    
    const xpGain = Math.max(10, Math.floor(packagePrice / 10));
    await NotificationHelpers.xpGained(
      request.userId, 
      xpGain, 
      `Purchase completed: ${request.product}`
    );
  } else {
    // Send status change notification for other statuses
    await NotificationHelpers.requestStatusChanged(
      request.userId, 
      request._id, 
      status, 
      request.product
    );
  }

  if (status === 'Accepted' && request.couponOwnerId && !request.couponRewardedAt && String(request.couponOwnerId) !== String(request.userId)) {
    await User.findByIdAndUpdate(request.couponOwnerId, {
      $inc: { couponBalance: Number(request.referralRewardAmount || 30) }
    });
    request.couponRewardedAt = new Date();
  }

  if (status === 'Accepted' && request.couponCode) {
    const coupon = await Coupon.findOne({ code: String(request.couponCode).trim().toUpperCase() });
    if (coupon) {
      coupon.usedCount = Number(coupon.usedCount || 0) + 1;
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        coupon.active = false;
      }
      await coupon.save();
    }
  }

  await request.save();

  // ── WhatsApp notification when accepted (no key in URL — security) ─────────
  if (status === 'Accepted' && request.whatsapp) {
    const waNumber = String(request.whatsapp).replace(/[^0-9]/g, '');
    const waMsg = encodeURIComponent(
      `✅ *Your order has been approved!*\n\n` +
      `Product: *${request.product}*\n` +
      `Package: ${request.packageName || 'N/A'}\n\n` +
      `🔑 Open the app to get your key:\n` +
      `👉 https://pannelstorewithadmin.vercel.app/dashboard\n\n` +
      `Thank you for ordering from SUSANTEDIT! 🎮`
    );
    request.whatsappLink = `https://wa.me/${waNumber}?text=${waMsg}`;
    await request.save();
  }

  // Discord/Telegram status-change alert — non-blocking
  sendStatusAlert({
    status,
    orderId:       String(request._id),
    userName:      request.userName,
    product:       request.product,
    packageName:   request.packageName,
    price:         request.finalPrice || request.packagePrice,
    paymentMethod: request.paymentMethod,
    tikTok:        request.tikTok,
    whatsapp:      request.whatsapp,
    transaction:   request.transaction,
    notes:         notes || '',
    whatsappLink:  request.whatsappLink || '',
  }).catch(() => {});

  return res.json({ ok: true, request: await Request.findById(request._id).lean() });
}

// Revoke an approval — resets to "Awaiting review" and clears the delivery key
export async function revokeRequest(req, res) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }

  const { id } = req.params;
  const shouldUseDb = Request.db && Request.db.readyState === 1;

  if (!shouldUseDb) {
    const request = inMemoryRequests.find(e => e.id === id);
    if (!request) return res.status(404).json({ ok: false, message: 'Request not found' });
    request.status = 'Awaiting review';
    request.notes = '';
    request.updatedAt = new Date().toISOString();
    return res.json({ ok: true, request });
  }

  const request = await Request.findByIdAndUpdate(
    id,
    { status: 'Awaiting review', notes: '' },
    { new: true }
  ).lean();

  if (!request) return res.status(404).json({ ok: false, message: 'Request not found' });

  // Discord/Telegram revoke alert — non-blocking
  sendStatusAlert({
    status:        'Revoked',
    orderId:       String(request._id),
    userName:      request.userName,
    product:       request.product,
    packageName:   request.packageName,
    price:         request.finalPrice || request.packagePrice,
    paymentMethod: request.paymentMethod,
    tikTok:        request.tikTok,
    whatsapp:      request.whatsapp,
    transaction:   request.transaction,
    notes:         '',
  }).catch(() => {});

  return res.json({ ok: true, request });
}

export async function markHeartbeat(_req, res) {
  const shouldUseDb = Request.db && Request.db.readyState === 1;

  if (!shouldUseDb) {
    return res.json({ ok: true, message: 'Heartbeat stored in memory', time: new Date().toISOString() });
  }

  const latestRequest = await Request.findOne().sort({ updatedAt: -1 });
  if (latestRequest) {
    latestRequest.lastPingAt = new Date();
    await latestRequest.save();
  }

  res.json({ ok: true, message: 'Heartbeat stored', time: new Date().toISOString() });
}

// ── Add XP when request is approved (called internally from updateRequestStatus)
export async function awardXpForPurchase(userId, packagePrice, bonusXp = 0) {
  try {
    const price = parseFloat(packagePrice) || 0;
    const baseXp = Math.max(10, Math.floor(price / 10)); // 10 XP per Rs 100 spent, min 10
    const totalXp = baseXp + bonusXp;
    
    await User.findByIdAndUpdate(userId, {
      $inc: { xp: totalXp, totalSpend: price }
    });
    
    console.log(`[XP] User ${userId} gained ${totalXp} XP (${baseXp} base + ${bonusXp} bonus) for Rs ${price} purchase`);
    return totalXp;
  } catch (error) {
    console.error('[XP] Failed to award XP:', error);
    return 0;
  }
}