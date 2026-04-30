import crypto from 'crypto';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';

const inMemoryCoupons = [];

function isDbReady() {
  return Coupon.db?.readyState === 1;
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function randomSuffix(length = 4) {
  return crypto.randomBytes(length).toString('hex').toUpperCase().slice(0, length);
}

export function generateReferralCode(seed = 'USER') {
  const base = normalizeCode(seed).replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'USER';
  return `${base}${randomSuffix(4)}`;
}

async function codeExists(code) {
  if (!code) return false;
  if (!isDbReady()) {
    return inMemoryCoupons.some((coupon) => coupon.code === code);
  }
  return Boolean(await Coupon.findOne({ code }).lean());
}

async function uniqueCode(seed) {
  let code = generateReferralCode(seed);
  let attempts = 0;
  while (await codeExists(code) && attempts < 8) {
    code = generateReferralCode(`${seed}${attempts}`);
    attempts += 1;
  }
  return code;
}

export async function ensureUserReferralCoupon(user) {
  if (!user) return null;
  const referralCode = normalizeCode(user.referralCode) || await uniqueCode(user.name || user.email || 'USER');
  const couponBalance = Number(user.couponBalance || 0);

  if (!isDbReady()) {
    user.referralCode = referralCode;
    user.couponBalance = couponBalance;
    return user;
  }

  let changed = false;
  if (!user.referralCode) {
    user.referralCode = referralCode;
    changed = true;
  }
  if (typeof user.couponBalance !== 'number') {
    user.couponBalance = couponBalance;
    changed = true;
  }
  if (changed) {
    await user.save();
  }

  const existing = await Coupon.findOne({ code: user.referralCode });
  if (!existing) {
    await Coupon.create({
      code: user.referralCode,
      ownerUserId: user._id,
      createdByUserId: user._id,
      type: 'referral',
      discountKind: 'flat',
      discountValue: 30,
      rewardAmount: 30,
      active: true,
      usageLimit: 0,
      note: 'Auto-generated referral code'
    });
  }

  return user;
}

export async function resolveCouponCode(rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return null;
  const now = new Date();

  if (!isDbReady()) {
    const coupon = inMemoryCoupons.find((entry) => entry.code === code && entry.active);
    if (!coupon) return null;
    if (coupon.startsAt && new Date(coupon.startsAt) > now) return null;
    if (coupon.endsAt && new Date(coupon.endsAt) < now) return null;
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return null;
    return coupon;
  }

  const coupon = await Coupon.findOne({ code }).lean();
  if (!coupon || !coupon.active) return null;
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return null;
  if (coupon.endsAt && new Date(coupon.endsAt) < now) return null;
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return null;
  return coupon;
}

export async function applyCouponReward(coupon, amount) {
  if (!coupon || !coupon.ownerUserId || !amount) return null;
  const rewardAmount = Number(amount) || 0;
  if (rewardAmount <= 0) return null;

  if (!isDbReady()) {
    return { ok: true, amount: rewardAmount };
  }

  await User.findByIdAndUpdate(coupon.ownerUserId, {
    $inc: { couponBalance: rewardAmount }
  });

  await Coupon.findByIdAndUpdate(coupon._id, {
    $inc: { usedCount: 1 },
    $set: { active: coupon.usageLimit > 0 ? coupon.usedCount + 1 < coupon.usageLimit : coupon.active }
  });

  return { ok: true, amount: rewardAmount };
}

export async function listCoupons(req, res) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }

  if (!isDbReady()) {
    return res.json({ ok: true, coupons: inMemoryCoupons });
  }

  const coupons = await Coupon.find().sort({ createdAt: -1 }).populate('ownerUserId', 'name email').lean();
  return res.json({ ok: true, coupons });
}

export async function createCoupon(req, res) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }

  const payload = req.body || {};
  const code = normalizeCode(payload.code) || await uniqueCode(payload.note || payload.type || 'PROMO');
  const discountKind = payload.discountKind === 'percent' ? 'percent' : 'flat';
  const discountValue = Number(payload.discountValue ?? payload.discountAmount ?? 30);
  const rewardAmount = Number(payload.rewardAmount ?? 30);
  const usageLimit = Number(payload.usageLimit || 0);
  const active = payload.active !== false;
  const note = String(payload.note || '').trim();
  const type = payload.type === 'referral' ? 'referral' : 'promo';
  const ownerEmail = String(payload.ownerEmail || '').trim().toLowerCase();
  const startsAt = payload.startsAt ? new Date(payload.startsAt) : null;
  const endsAt = payload.endsAt ? new Date(payload.endsAt) : null;

  let ownerUserId = null;
  if (ownerEmail) {
    const owner = await User.findOne({ email: ownerEmail }).select('_id').lean();
    if (owner) ownerUserId = owner._id;
  }

  const couponData = {
    code,
    ownerUserId,
    createdByUserId: req.auth.userId,
    type,
    discountKind,
    discountValue,
    rewardAmount,
    active,
    usageLimit,
    note,
    startsAt: Number.isNaN(startsAt?.getTime?.()) ? null : startsAt,
    endsAt: Number.isNaN(endsAt?.getTime?.()) ? null : endsAt
  };

  if (!isDbReady()) {
    const coupon = { id: `coupon-${Date.now()}`, ...couponData, usedCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    inMemoryCoupons.unshift(coupon);
    return res.status(201).json({ ok: true, coupon });
  }

  const existing = await Coupon.findOne({ code });
  if (existing) {
    return res.status(409).json({ ok: false, message: 'Coupon code already exists' });
  }

  const coupon = await Coupon.create(couponData);
  return res.status(201).json({ ok: true, coupon });
}

export async function updateCoupon(req, res) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }

  const { id } = req.params;
  const payload = req.body || {};

  if (!isDbReady()) {
    const coupon = inMemoryCoupons.find((entry) => entry.id === id || entry.code === id);
    if (!coupon) return res.status(404).json({ ok: false, message: 'Coupon not found' });
    if (payload.code !== undefined) coupon.code = normalizeCode(payload.code);
    if (payload.discountKind !== undefined) coupon.discountKind = payload.discountKind === 'percent' ? 'percent' : 'flat';
    if (payload.discountValue !== undefined) coupon.discountValue = Number(payload.discountValue) || coupon.discountValue;
    if (payload.rewardAmount !== undefined) coupon.rewardAmount = Number(payload.rewardAmount) || coupon.rewardAmount;
    if (payload.active !== undefined) coupon.active = Boolean(payload.active);
    if (payload.usageLimit !== undefined) coupon.usageLimit = Number(payload.usageLimit) || 0;
    if (payload.note !== undefined) coupon.note = String(payload.note || '').trim();
    if (payload.startsAt !== undefined) coupon.startsAt = payload.startsAt ? new Date(payload.startsAt).toISOString() : null;
    if (payload.endsAt !== undefined) coupon.endsAt = payload.endsAt ? new Date(payload.endsAt).toISOString() : null;
    coupon.updatedAt = new Date().toISOString();
    return res.json({ ok: true, coupon });
  }

  const update = {};
  if (payload.code !== undefined) update.code = normalizeCode(payload.code);
  if (payload.discountKind !== undefined) update.discountKind = payload.discountKind === 'percent' ? 'percent' : 'flat';
  if (payload.discountValue !== undefined) update.discountValue = Number(payload.discountValue) || 0;
  if (payload.rewardAmount !== undefined) update.rewardAmount = Number(payload.rewardAmount) || 0;
  if (payload.active !== undefined) update.active = Boolean(payload.active);
  if (payload.usageLimit !== undefined) update.usageLimit = Number(payload.usageLimit) || 0;
  if (payload.note !== undefined) update.note = String(payload.note || '').trim();
  if (payload.startsAt !== undefined) update.startsAt = payload.startsAt ? new Date(payload.startsAt) : null;
  if (payload.endsAt !== undefined) update.endsAt = payload.endsAt ? new Date(payload.endsAt) : null;

  const coupon = await Coupon.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate('ownerUserId', 'name email').lean();
  if (!coupon) return res.status(404).json({ ok: false, message: 'Coupon not found' });
  return res.json({ ok: true, coupon });
}

export async function deleteCoupon(req, res) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }

  const { id } = req.params;

  if (!isDbReady()) {
    const coupon = inMemoryCoupons.find((entry) => entry.id === id || entry.code === id);
    if (!coupon) return res.status(404).json({ ok: false, message: 'Coupon not found' });
    coupon.active = false;
    coupon.updatedAt = new Date().toISOString();
    return res.json({ ok: true, coupon });
  }

  const coupon = await Coupon.findByIdAndUpdate(id, { active: false }, { new: true }).lean();
  if (!coupon) return res.status(404).json({ ok: false, message: 'Coupon not found' });
  return res.json({ ok: true, coupon });
}
