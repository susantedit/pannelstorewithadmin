import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../lib/firebaseAdmin.js';

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return { type: 'bearer', token: authHeader.slice(7) };
  const cookie = req.cookies?.sessionToken || null;
  if (cookie) return { type: 'cookie', token: cookie };
  return null;
}

function isDbReady() {
  return User.db?.readyState === 1;
}

export async function requireAuth(req, res, next) {
  try {
    const tokenInfo = getTokenFromRequest(req);
    if (!tokenInfo) {
      return res.status(401).json({ ok: false, message: 'Authentication required' });
    }

    let userId, role, emailVerified;

    // Try JWT first (cookie or bearer)
    const secret = process.env.JWT_SECRET;
    if (secret) {
      try {
        const payload = jwt.verify(tokenInfo.token, secret);
        userId = payload.sub;
        role = payload.role;
        emailVerified = payload.emailVerified;
      } catch {
        // JWT failed — try Firebase token verification for any token type
        try {
          const decoded = await verifyFirebaseToken(tokenInfo.token);
          if (decoded) {
            const email = (decoded.email || '').toLowerCase();
            if (email) {
              let user = await User.findOne({ email });
              if (user) {
                userId = user._id.toString();
                role = user.role;
                emailVerified = decoded.email_verified ?? true;
              }
            }
          }
        } catch {}
      }
    }

    if (!userId) {
      return res.status(401).json({ ok: false, message: 'Session expired or invalid' });
    }

    req.auth = { userId, role, emailVerified };

    if (isDbReady()) {
      const user = await User.findById(userId).select(
        'name email role emailVerified lastLoginAt createdAt updatedAt referralCode couponBalance profile firebaseUid vipExpiresAt'
      );
      if (!user) {
        return res.status(401).json({ ok: false, message: 'Invalid session' });
      }
      req.user = user;
      // Update lastActiveAt (throttled — only if not updated in last 5 min)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (!user.lastActiveAt || user.lastActiveAt < fiveMinAgo) {
        User.findByIdAndUpdate(userId, { lastActiveAt: new Date() }).catch(() => {});
      }
    } else {
      req.user = { _id: userId, id: userId, name: 'User', email: '', role, emailVerified };
    }

    next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Session expired or invalid' });
  }
}

export function requireVerifiedEmail(req, res, next) {
  // In dev mode without DB, skip email verification requirement
  if (process.env.NODE_ENV !== 'production' && !isDbReady()) {
    return next();
  }
  if (!req.auth?.emailVerified) {
    return res.status(403).json({ ok: false, message: 'Please verify your email first' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }
  next();
}
