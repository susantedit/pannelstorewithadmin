import Request from '../models/Request.js';
import User from '../models/User.js';
import { resolveCouponCode } from './couponController.js';

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

  const shouldUseDb = Request.db && Request.db.readyState === 1;

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
    status: 'Awaiting review'
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

  if (status === 'Accepted' && request.couponOwnerId && !request.couponRewardedAt && String(request.couponOwnerId) !== String(request.userId)) {
    await User.findByIdAndUpdate(request.couponOwnerId, {
      $inc: { couponBalance: Number(request.referralRewardAmount || 30) }
    });
    request.couponRewardedAt = new Date();
  }

  await request.save();

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
