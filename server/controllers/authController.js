import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { ensureUserReferralCoupon } from './couponController.js';
import { NotificationHelpers } from './notificationController.js';

// ---------------------------------------------------------------------------
// In-memory store — used when MongoDB is not connected
// ---------------------------------------------------------------------------
const memUsers = [];

function isDbReady() {
  return User.db?.readyState === 1;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function sanitizeUser(user) {
  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    referralCode: user.referralCode || '',
    couponBalance: Number(user.couponBalance || 0),
    vipExpiresAt: user.vipExpiresAt || null,
    profile: {
      uid: user.profile?.uid || '',
      gameId: user.profile?.gameId || '',
      tiktok: user.profile?.tiktok || '',
      whatsapp: user.profile?.whatsapp || '',
      displayName: user.profile?.displayName || '',
      avatarUrl: user.profile?.avatarUrl || '',
      birthday: user.profile?.birthday || ''
    }
  };
}

function signSession(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(
    { role: user.role, emailVerified: user.emailVerified },
    secret,
    { subject: user._id?.toString() || user.id, expiresIn: '30d' }
  );
}

// Cookie options — cross-origin safe for Vercel (client) + Render (server)
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30   // 30 days
  };
}

function buildMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user, pass }
  });
}

async function sendVerificationEmail(user, rawToken) {
  const transport = buildMailer();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  if (!transport) {
    console.info(`[auth] Email verification link for ${user.email}: ${verifyUrl}`);
    return;
  }
  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: 'Verify your email',
    text: `Verify your email: ${verifyUrl}`,
    html: `<p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  });
}

async function sendResetEmail(user, rawToken) {
  const transport = buildMailer();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  if (!transport) {
    console.info(`[auth] Password reset link for ${user.email}: ${resetUrl}`);
    return;
  }
  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: 'Reset your password',
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });
}

// ---------------------------------------------------------------------------
// In-memory auth helpers
// ---------------------------------------------------------------------------
function memFindByEmail(email) {
  return memUsers.find(u => u.email === email) || null;
}

function memFindById(id) {
  return memUsers.find(u => u.id === id) || null;
}

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------
export async function register(req, res) {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!name || name.length < 2 || name.length > 80) {
    return res.status(400).json({ ok: false, message: 'Name must be 2–80 characters' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ ok: false, message: 'Valid email is required' });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters' });
  }

  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDbReady()) {
    // In-memory fallback
    if (memFindByEmail(email)) {
      return res.status(409).json({ ok: false, message: 'Account already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = {
      id: `mem-${Date.now()}`,
      name,
      email,
      passwordHash,
      role: 'user',
      emailVerified: true, // auto-verify in memory mode
      referralCode: '',
      couponBalance: 0,
      profile: { uid: '', gameId: '', tiktok: '', whatsapp: '', displayName: name, birthday: '' },
      loginAttempts: 0,
      lockUntil: null,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memUsers.push(newUser);
    await ensureUserReferralCoupon(newUser);
    return res.status(201).json({ ok: true, message: 'Account created. You can now sign in.' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ ok: false, message: 'Account already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const rawVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationTokenHash = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'user',
    // In dev without SMTP, auto-verify so users can log in immediately
    emailVerified: isDev,
    referralCode: '',
    couponBalance: 0,
    profile: { uid: '', gameId: '', tiktok: '', whatsapp: '', displayName: name, birthday: '' },
    emailVerificationTokenHash: isDev ? undefined : emailVerificationTokenHash,
    emailVerificationExpiresAt: isDev ? undefined : new Date(Date.now() + 1000 * 60 * 60 * 24)
  });

  await ensureUserReferralCoupon(user);
  
  // Send welcome notification
  await NotificationHelpers.welcomeUser(user._id, user.name);

  if (!isDev) {
    await sendVerificationEmail(user, rawVerificationToken);
    return res.status(201).json({
      ok: true,
      message: 'Account created. Check your email to verify your account.'
    });
  }

  return res.status(201).json({ ok: true, message: 'Account created. You can now sign in.' });
}

export async function verifyEmail(req, res) {
  const rawToken = String(req.query?.token || '').trim();
  if (!rawToken) {
    return res.status(400).json({ ok: false, message: 'Verification token is required' });
  }

  if (!isDbReady()) {
    return res.status(503).json({ ok: false, message: 'Database not available' });
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({ ok: false, message: 'Invalid or expired verification token' });
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  return res.json({ ok: true, message: 'Email verified successfully' });
}

export async function login(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!validateEmail(email) || !password) {
    return res.status(400).json({ ok: false, message: 'Email and password are required' });
  }

  if (!isDbReady()) {
    // In-memory fallback
    const user = memFindByEmail(email);
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid email or password' });
    }

    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      return res.status(429).json({ ok: false, message: 'Too many failed attempts. Try again later.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 1000 * 60 * 15).toISOString();
        user.loginAttempts = 0;
      }
      return res.status(401).json({ ok: false, message: 'Invalid email or password' });
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date().toISOString();

    await ensureUserReferralCoupon(user);

    const token = jwt.sign(
      { role: user.role, emailVerified: user.emailVerified },
      process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET not configured'); })(),
      { subject: user.id, expiresIn: '30d' }
    );

    res.cookie('sessionToken', token, cookieOptions());

    return res.json({ ok: true, user: sanitizeUser(user) });
  }

  const user = await User.findOne({ email }).select('+passwordHash +loginAttempts +lockUntil');
  if (!user) {
    return res.status(401).json({ ok: false, message: 'Invalid email or password' });
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    return res.status(429).json({ ok: false, message: 'Too many failed attempts. Try again later.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 1000 * 60 * 15);
      user.loginAttempts = 0;
    }
    await user.save();
    return res.status(401).json({ ok: false, message: 'Invalid email or password' });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ ok: false, message: 'Please verify your email before signing in' });
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  await ensureUserReferralCoupon(user);

  const token = signSession(user);
  res.cookie('sessionToken', token, cookieOptions());

  return res.json({ ok: true, user: sanitizeUser(user) });
}

export async function logout(_req, res) {
  res.clearCookie('sessionToken');
  return res.json({ ok: true, message: 'Signed out' });
}

export async function me(req, res) {
  const user = await ensureUserReferralCoupon(req.user);
  return res.json({ ok: true, user: sanitizeUser(user || req.user) });
}

export async function forgotPassword(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!validateEmail(email)) {
    return res.status(400).json({ ok: false, message: 'Valid email is required' });
  }

  if (!isDbReady()) {
    // Don't leak whether account exists
    return res.json({ ok: true, message: 'If the account exists, a reset email was sent.' });
  }

  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  if (!user) {
    return res.json({ ok: true, message: 'If the account exists, a reset email was sent.' });
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
  user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
  await user.save();

  await sendResetEmail(user, rawResetToken);
  return res.json({ ok: true, message: 'If the account exists, a reset email was sent.' });
}

export async function resetPassword(req, res) {
  const rawToken = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');

  if (!rawToken || !validatePassword(password)) {
    return res.status(400).json({ ok: false, message: 'Valid token and password are required' });
  }

  if (!isDbReady()) {
    return res.status(503).json({ ok: false, message: 'Database not available' });
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() }
  }).select('+passwordHash');

  if (!user) {
    return res.status(400).json({ ok: false, message: 'Invalid or expired reset token' });
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  return res.json({ ok: true, message: 'Password reset successfully' });
}

// ---------------------------------------------------------------------------
// Firebase Auth — exchange a Firebase ID token for a session cookie
// ---------------------------------------------------------------------------
import { verifyFirebaseToken } from '../lib/firebaseAdmin.js';

/**
 * POST /api/auth/firebase
 * Body: { idToken: string, name?: string }
 *
 * Verifies the Firebase ID token, upserts the user in MongoDB (or memory),
 * then issues the same httpOnly session cookie used by the rest of the app.
 */
export async function firebaseSession(req, res) {
  const idToken = String(req.body?.idToken || '').trim();
  const displayName = String(req.body?.name || '').trim();

  if (!idToken) {
    return res.status(400).json({ ok: false, message: 'Firebase ID token is required' });
  }

  // Verify with Firebase Admin
  let decoded;
  try {
    decoded = await verifyFirebaseToken(idToken);
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid or expired Firebase token' });
  }

  if (!decoded) {
    return res.status(503).json({ ok: false, message: 'Firebase Admin SDK not configured' });
  }

  const email = (decoded.email || '').toLowerCase();
  const name = displayName || decoded.name || email.split('@')[0];
  const emailVerified = decoded.email_verified ?? false;
  const firebaseUid = decoded.uid;

  if (!email) {
    return res.status(400).json({ ok: false, message: 'Firebase account has no email' });
  }

  if (!isDbReady()) {
    // In-memory fallback
    let user = memFindByEmail(email);
    if (!user) {
      user = {
        id: `fb-${firebaseUid}`,
        name,
        email,
        passwordHash: '',
        role: 'user',
        emailVerified: true,
        referralCode: '',
        couponBalance: 0,
        profile: { uid: '', gameId: '', tiktok: '', whatsapp: '', displayName: name, avatarUrl: '', birthday: '' },
        loginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memUsers.push(user);
    } else {
      user.lastLoginAt = new Date().toISOString();
    }

    await ensureUserReferralCoupon(user);

    const token = jwt.sign(
      { role: user.role, emailVerified: true },
      process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET not configured'); })(),
      { subject: user.id, expiresIn: '30d' }
    );

    res.cookie('sessionToken', token, cookieOptions());

    return res.json({ ok: true, user: sanitizeUser(user) });
  }

  // Upsert user in MongoDB — find by email, create if not exists
  let user = await User.findOne({ email });
  const isNewUser = !user;
  
  if (!user) {
    user = await User.create({
      name,
      email,
      passwordHash: '', // no password — Firebase handles auth
      role: 'user',
      emailVerified: emailVerified || true, // Firebase already verified
      referralCode: '',
      couponBalance: 0,
      profile: { uid: '', gameId: '', tiktok: '', whatsapp: '', displayName: name, birthday: '' },
      firebaseUid
    });
    
    // Send welcome notification for new users
    await NotificationHelpers.welcomeUser(user._id, user.name);
  } else {
    // Update last login and sync name if it was empty
    user.lastLoginAt = new Date();
    if (!user.name && name) user.name = name;
    if (!user.emailVerified) user.emailVerified = true;
    await user.save();
  }

  await ensureUserReferralCoupon(user);

  const token = signSession(user);
  res.cookie('sessionToken', token, cookieOptions());

  return res.json({ ok: true, user: sanitizeUser(user) });
}

/**
 * PATCH /api/auth/profile
 * Update user profile (displayName, avatarUrl, etc.)
 */
export async function updateProfile(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ ok: false, message: 'Unauthorized' });

  const { displayName, avatarUrl, birthday, uid, gameId, tiktok, whatsapp } = req.body || {};

  try {
    const update = { $set: {} };
    if (displayName !== undefined) update.$set['profile.displayName'] = displayName;
    if (avatarUrl !== undefined) update.$set['profile.avatarUrl'] = avatarUrl;
    if (birthday !== undefined) update.$set['profile.birthday'] = birthday;
    if (uid !== undefined) update.$set['profile.uid'] = uid;
    if (gameId !== undefined) update.$set['profile.gameId'] = gameId;
    if (tiktok !== undefined) update.$set['profile.tiktok'] = tiktok;
    if (whatsapp !== undefined) update.$set['profile.whatsapp'] = whatsapp;

    if (isDbReady()) {
      await User.updateOne({ _id: userId }, update);
      const user = await User.findById(userId);
      return res.json({ ok: true, user: sanitizeUser(user), message: 'Profile updated' });
    } else {
      const user = memUsers.find(u => u.id === userId);
      if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
      Object.keys(update.$set).forEach(key => {
        const parts = key.split('.');
        if (parts.length === 2) {
          if (!user[parts[0]]) user[parts[0]] = {};
          user[parts[0]][parts[1]] = update.$set[key];
        } else {
          user[key] = update.$set[key];
        }
      });
      return res.json({ ok: true, user: sanitizeUser(user), message: 'Profile updated' });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Failed to update profile' });
  }
}

/**
 * POST /api/auth/upload-avatar
 * Upload avatar image
 */
export async function uploadAvatar(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ ok: false, message: 'Unauthorized' });

  try {
    const file = req.files?.avatar;
    if (!file) {
      return res.status(400).json({ ok: false, message: 'No file uploaded' });
    }

    const base64 = file.data.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;

    if (isDbReady()) {
      await User.updateOne({ _id: userId }, { $set: { 'profile.avatarUrl': dataUrl } });
      return res.json({ ok: true, avatarUrl: dataUrl, message: 'Avatar uploaded' });
    } else {
      const user = memUsers.find(u => u.id === userId);
      if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
      if (!user.profile) user.profile = {};
      user.profile.avatarUrl = dataUrl;
      return res.json({ ok: true, avatarUrl: dataUrl, message: 'Avatar uploaded' });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Failed to upload avatar' });
  }
}


