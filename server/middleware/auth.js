import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return req.cookies?.sessionToken || null;
}

function isDbReady() {
  return User.db?.readyState === 1;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ ok: false, message: 'Authentication required' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[auth] FATAL: JWT_SECRET environment variable is not set');
      return res.status(500).json({ ok: false, message: 'Server configuration error' });
    }
    const payload = jwt.verify(token, secret);

    req.auth = {
      userId: payload.sub,
      role: payload.role,
      emailVerified: payload.emailVerified
    };

    if (isDbReady()) {
      const user = await User.findById(payload.sub).select(
        'name email role emailVerified lastLoginAt createdAt updatedAt referralCode couponBalance profile firebaseUid'
      );
      if (!user) {
        return res.status(401).json({ ok: false, message: 'Invalid session' });
      }
      req.user = user;
    } else {
      // In-memory mode: reconstruct a minimal user object from the JWT payload
      req.user = {
        _id: payload.sub,
        id: payload.sub,
        name: payload.name || 'User',
        email: payload.email || '',
        role: payload.role,
        emailVerified: payload.emailVerified
      };
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
