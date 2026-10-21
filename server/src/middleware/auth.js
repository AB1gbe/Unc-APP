// Session handling and the permission "gates" every route uses.
//
//   requireAuth      -> must be logged in
//   requireVerified  -> logged in + email verified + KYC approved
//   requireAdmin     -> logged in + admin role
import { sha256 } from '../lib/crypto.js';
import { HttpError } from '../lib/http.js';
import { avatarUrl } from '../lib/uploads.js';

export const SESSION_COOKIE = 'unc_session';

export function loadUser(db) {
  const findSession = db.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
  `);
  return (req, _res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    req.user = token ? findSession.get(sha256(token)) || null : null;
    req.sessionTokenHash = token ? sha256(token) : null;
    next();
  };
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Please log in first.'));
  if (req.user.banned_at) return next(new HttpError(403, 'This account has been suspended.'));
  next();
}

export function requireVerified(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (!req.user.email_verified_at) {
      return next(new HttpError(403, 'Please verify your email address first.', { code: 'EMAIL_UNVERIFIED' }));
    }
    if (req.user.kyc_status !== 'approved') {
      return next(new HttpError(403, 'You need to complete identity verification (KYC) first.', { code: 'KYC_REQUIRED' }));
    }
    next();
  });
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'admin') return next(new HttpError(403, 'Admins only.'));
    next();
  });
}

// What the client is allowed to see about the logged-in user.
export const parseInterests = (json) => {
  try {
    const list = JSON.parse(json || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export function publicMe(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    accountType: u.account_type,
    role: u.role,
    city: u.city,
    emailVerified: Boolean(u.email_verified_at),
    kycStatus: u.kyc_status,
    createdAt: u.created_at,
    language: u.language,
    avatarUrl: avatarUrl(u.avatar),
    bio: u.bio,
    interests: parseInterests(u.interests),
    onboarded: Boolean(u.onboarded_at),
  };
}
