// Logging in = a session row + a cookie (moved here from routes/auth.js in
// session 88 so team members can switch to a business).
// actorId: a team member acting for the business (userId = the business).
import { config } from '../config.js';
import { randomToken, sha256 } from './crypto.js';
import { SESSION_COOKIE } from '../middleware/auth.js';

export function startSession(db, res, userId, actorId = null) {
  const token = randomToken();
  const expires = new Date(Date.now() + config.sessionDays * 864e5);
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, actor_id) VALUES (?, ?, ?, ?)')
    .run(sha256(token), userId, expires.toISOString().replace('T', ' ').slice(0, 19), actorId);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,       // JavaScript in the page can't read it (XSS protection)
    sameSite: 'lax',      // not sent on cross-site POSTs (CSRF protection)
    secure: config.isProd,
    expires,
    path: '/',
  });
}
