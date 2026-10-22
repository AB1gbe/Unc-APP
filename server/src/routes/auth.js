import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { hashPassword, verifyPassword, randomToken, sha256, pepperedHash, sixDigitCode } from '../lib/crypto.js';
import { HttpError } from '../lib/http.js';
import { audit, tx } from '../db.js';
import * as v from '../lib/validate.js';
import { SESSION_COOKIE, requireAuth, publicMe } from '../middleware/auth.js';
import { trySendMail } from '../lib/mailer.js';
import { verificationCodeEmail, passwordResetEmail, passwordChangedEmail } from '../lib/emails.js';
import { LANGS, langOf, translateMessage } from '../lib/i18n.js';
import { AVATAR_DIR, COVER_DIR, memoryUpload, saveFiles } from '../lib/uploads.js';
import { CATEGORIES } from '../lib/categories.js';
import { CONTACT_MESSAGE, hasContactDetails } from '../lib/contact-guard.js';
import { readShopHours } from '../lib/shop-hours.js';
import { normalizeCity } from '../../../shared/areas.js';
import { DELETE_AFTER_DAYS, exportData } from '../lib/deletion.js';
import { MAX_AWAY_DAYS, setAway } from '../lib/activity.js';

const sqlTime = (d) => d.toISOString().replace('T', ' ').slice(0, 19);

export function authRoutes(db) {
  const r = Router();

  // Slow down guessing and spam. Each action has its OWN counter per visitor
  // (IP address), so e.g. opening a reset link doesn't use up login attempts.
  // Behind a hosting proxy, set TRUST_PROXY so each visitor gets their own
  // IP instead of all sharing the proxy's (see config.js). Off in tests.
  const limit = (max) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.isTest ? 10_000 : max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Sent by the limiter itself (not errorHandler), so translate here.
    handler: (req, res, _next, options) => res.status(options.statusCode)
      .json({ error: translateMessage('Too many attempts. Please wait a few minutes.', langOf(req)) }),
  });
  const limits = {
    register: limit(10),
    login: limit(20),
    verifyEmail: limit(20),
    resendCode: limit(5),
    forgot: limit(5),
    resetCheck: limit(30),
    reset: limit(10),
    changePassword: limit(10),
  };

  function startSession(res, userId) {
    const token = randomToken();
    const expires = new Date(Date.now() + config.sessionDays * 864e5);
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .run(sha256(token), userId, expires.toISOString().replace('T', ' ').slice(0, 19));
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,       // JavaScript in the page can't read it (XSS protection)
      sameSite: 'lax',      // not sent on cross-site POSTs (CSRF protection)
      secure: config.isProd,
      expires,
      path: '/',
    });
  }

  // Saves a new code and returns it. The caller sends the email.
  function issueEmailCode(user) {
    const code = sixDigitCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    db.prepare(`
      INSERT INTO email_codes (user_id, code_hash, expires_at, attempts) VALUES (?, ?, ?, 0)
      ON CONFLICT(user_id) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0
    `).run(user.id, pepperedHash(code), expires);
    return code;
  }

  // When emails are only printed (console) or kept in memory (tests), we
  // also hand the code back in the response so you can test without a mail
  // provider. Never in production, and not when real email is configured.
  const showDevCode = !config.isProd && ['console', 'memory'].includes(config.mail.transport);
  const devExtra = (code) => (showDevCode ? { devCode: code } : {});

  r.post('/register', limits.register, async (req, res) => {
    const email = v.email(req.body);
    const password = v.password(req.body);
    const displayName = v.str(req.body, 'displayName', { min: 2, max: 60 });
    const accountType = v.oneOf(req.body, 'accountType', ['individual', 'business']);
    const city = normalizeCity(v.str(req.body, 'city', { max: 80, optional: true }));
    // The language the website was in when they signed up (emails use it).
    const language = langOf(req);

    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
      throw new HttpError(409, 'An account with this email already exists.', { field: 'email' });
    }
    const hash = await hashPassword(password);
    let info;
    try {
      info = db.prepare(`
        INSERT INTO users (email, password_hash, display_name, account_type, city, language) VALUES (?, ?, ?, ?, ?, ?)
      `).run(email, hash, displayName, accountType, city, language);
    } catch (err) {
      // Two sign-ups with the same email at the same moment: the check above
      // passed for both, the database's UNIQUE rule stops the second.
      if (/UNIQUE constraint failed: users\.email/.test(err.message)) {
        throw new HttpError(409, 'An account with this email already exists.', { field: 'email' });
      }
      throw err;
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    const code = issueEmailCode(user);
    startSession(res, user.id);
    // The account exists even if the email fails; the user can resend.
    const emailSent = await trySendMail({ to: user.email, ...verificationCodeEmail(code, user.language) });
    res.status(201).json({ user: publicMe(user), emailSent, ...devExtra(code) });
  });

  r.post('/login', limits.login, async (req, res) => {
    const email = v.email(req.body);
    const password = v.str(req.body, 'password', { max: 200 });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Same message whether the email exists or not, so attackers can't
    // discover which emails are registered.
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new HttpError(401, 'Wrong email or password.');
    }
    if (user.banned_at) throw new HttpError(403, 'This account has been suspended.');
    startSession(res, user.id);
    res.json({ user: publicMe(user) });
  });

  r.post('/logout', (req, res) => {
    if (req.sessionTokenHash) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.sessionTokenHash);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  r.get('/me', (req, res) => {
    res.json({ user: publicMe(req.user) });
  });

  r.post('/verify-email', limits.verifyEmail, requireAuth, (req, res) => {
    if (req.user.email_verified_at) return res.json({ user: publicMe(req.user) });
    const code = v.str(req.body, 'code', { min: 6, max: 6 });
    const row = db.prepare('SELECT * FROM email_codes WHERE user_id = ?').get(req.user.id);
    if (!row || row.expires_at < new Date().toISOString().replace('T', ' ').slice(0, 19)) {
      throw new HttpError(400, 'This code has expired. Request a new one.');
    }
    if (row.attempts >= 5) throw new HttpError(429, 'Too many wrong codes. Request a new one.');
    if (row.code_hash !== pepperedHash(code)) {
      db.prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE user_id = ?').run(req.user.id);
      throw new HttpError(400, 'That code is not correct.', { field: 'code' });
    }
    db.prepare(`UPDATE users SET email_verified_at = datetime('now') WHERE id = ?`).run(req.user.id);
    db.prepare('DELETE FROM email_codes WHERE user_id = ?').run(req.user.id);
    res.json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  r.post('/resend-code', limits.resendCode, requireAuth, async (req, res) => {
    if (req.user.email_verified_at) throw new HttpError(400, 'Email is already verified.');
    const code = issueEmailCode(req.user);
    if (!(await trySendMail({ to: req.user.email, ...verificationCodeEmail(code, req.user.language) }))) {
      throw new HttpError(502, "We couldn't send the email right now. Please try again in a minute.");
    }
    res.json({ ok: true, ...devExtra(code) });
  });

  // ---- Password reset (logged out) ----
  // Step 1: ask for a link. ALWAYS answers the same way, whether or not the
  // email has an account, so nobody can use this to discover members.
  r.post('/forgot-password', limits.forgot, async (req, res) => {
    const email = v.email(req.body);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (user && !user.banned_at) {
      const token = randomToken();
      const expires = sqlTime(new Date(Date.now() + config.resetTokenMinutes * 60 * 1000));
      // Only the newest link works: drop older unused ones.
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
      db.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
        .run(sha256(token), user.id, expires);
      // Not awaited on purpose: waiting for the mail provider would make
      // "account exists" answers slower, which leaks who is a member.
      trySendMail({ to: user.email, ...passwordResetEmail(token, user.language) });
    }
    res.json({ ok: true, message: translateMessage('If an account exists for that email, a reset link is on its way.', langOf(req)) });
  });

  function findResetToken(token) {
    const row = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(sha256(token));
    if (!row || row.used_at || row.expires_at < sqlTime(new Date())) {
      throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.', { code: 'RESET_INVALID' });
    }
    return row;
  }

  // Lets the reset page say "link expired" before the user types a password.
  r.post('/reset-password/check', limits.resetCheck, (req, res) => {
    findResetToken(v.str(req.body, 'token', { max: 200 }));
    res.json({ ok: true });
  });

  // Step 2: set the new password with the token from the email.
  r.post('/reset-password', limits.reset, async (req, res) => {
    const row = findResetToken(v.str(req.body, 'token', { max: 200 }));
    const password = v.password(req.body);
    const hash = await hashPassword(password);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
    tx(db, () => {
      // Claim the link atomically. Two clicks at once both passed the check
      // above (hashing takes time); only one can flip used_at here.
      const claimed = db.prepare(`
        UPDATE password_resets SET used_at = datetime('now')
        WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')
      `).run(row.token_hash);
      if (!claimed.changes || user.banned_at) {
        throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.', { code: 'RESET_INVALID' });
      }
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
      // Log out everywhere: whoever had the old password loses access.
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      // They clicked a link sent to their inbox, which proves they own it.
      if (!user.email_verified_at) db.prepare(`UPDATE users SET email_verified_at = datetime('now') WHERE id = ?`).run(user.id);
      audit(db, user.id, 'auth.password_reset', `user:${user.id}`);
    });
    await trySendMail({ to: user.email, ...passwordChangedEmail(user.language) });
    res.json({ ok: true });
  });

  // ---- Change password (logged in) ----
  // "Download my data" (session 37): everything Unc holds about me, as JSON.
  r.get('/me/export', requireAuth, (req, res) => {
    audit(db, req.user.id, 'user.exported', `user:${req.user.id}`);
    res.set('Content-Disposition', `attachment; filename="unc-my-data-${new Date().toISOString().slice(0, 10)}.json"`);
    res.set('Cache-Control', 'no-store');
    res.json(exportData(db, req.user));
  });

  // "Delete my account": needs the password. The account is wiped after
  // DELETE_AFTER_DAYS (lib/deletion.js); until then it can be cancelled.
  // Open requests close now, and other devices are logged out.
  r.post('/me/delete', limits.changePassword, requireAuth, async (req, res) => {
    if (req.user.role === 'admin') throw new HttpError(400, 'Admin accounts cannot be deleted here.');
    const password = v.str(req.body, 'password', { max: 200 });
    if (!(await verifyPassword(password, req.user.password_hash))) {
      throw new HttpError(400, 'Your password is not correct.', { field: 'password' });
    }
    tx(db, () => {
      db.prepare(`UPDATE users SET delete_requested_at = datetime('now') WHERE id = ? AND delete_requested_at IS NULL`).run(req.user.id);
      db.prepare(`UPDATE listings SET status = 'closed', updated_at = datetime('now') WHERE buyer_id = ? AND status = 'open'`).run(req.user.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(req.user.id, req.sessionTokenHash);
      audit(db, req.user.id, 'user.delete_requested', `user:${req.user.id}`, { days: DELETE_AFTER_DAYS });
    });
    res.json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  r.post('/me/delete/cancel', requireAuth, (req, res) => {
    db.prepare('UPDATE users SET delete_requested_at = NULL WHERE id = ?').run(req.user.id);
    audit(db, req.user.id, 'user.delete_cancelled', `user:${req.user.id}`);
    res.json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  r.post('/change-password', limits.changePassword, requireAuth, async (req, res) => {
    const current = v.str(req.body, 'currentPassword', { max: 200 });
    const password = v.password(req.body);
    if (!(await verifyPassword(current, req.user.password_hash))) {
      throw new HttpError(400, 'Your current password is not correct.', { field: 'currentPassword' });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(password), req.user.id);
    // Log out every OTHER device, keep this one.
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(req.user.id, req.sessionTokenHash);
    audit(db, req.user.id, 'auth.password_changed', `user:${req.user.id}`);
    await trySendMail({ to: req.user.email, ...passwordChangedEmail(req.user.language) });
    res.json({ ok: true });
  });

  // The website calls this when a logged-in member switches language, so
  // emails reach them in the language they use.
  r.put('/language', requireAuth, (req, res) => {
    const language = v.oneOf(req.body, 'language', LANGS);
    db.prepare('UPDATE users SET language = ? WHERE id = ?').run(language, req.user.id);
    res.json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  // Edit profile. Only the fields that are sent are changed.
  r.patch('/me', requireAuth, (req, res) => {
    const b = req.body || {};
    const changes = {};
    if ('displayName' in b) changes.display_name = v.str(b, 'displayName', { min: 2, max: 60 });
    if ('city' in b) changes.city = normalizeCity(v.str(b, 'city', { max: 80, optional: true }));
    if ('bio' in b) changes.bio = v.str(b, 'bio', { max: 300, optional: true });
    // Public text must not carry a way to contact the member directly.
    if (hasContactDetails(changes.bio)) throw new HttpError(400, CONTACT_MESSAGE, { field: 'bio' });
    const isShop = req.user.account_type === 'business';
    if (('shopArea' in b || 'shopHours' in b) && !isShop) throw new HttpError(400, 'Only business accounts have a shop page.');
    if ('shopArea' in b) {
      changes.shop_area = v.str(b, 'shopArea', { max: 80, optional: true });
      if (hasContactDetails(changes.shop_area)) throw new HttpError(400, CONTACT_MESSAGE, { field: 'shopArea' });
    }
    if ('shopHours' in b) {
      const hours = readShopHours(b.shopHours);
      changes.shop_hours = hours && JSON.stringify(hours);
    }
    if ('interests' in b) {
      const list = Array.isArray(b.interests) ? [...new Set(b.interests)] : null;
      if (!list || list.length > 8 || list.some((c) => !CATEGORIES.includes(c))) {
        throw new HttpError(400, 'Choose up to 8 interests from the list.', { field: 'interests' });
      }
      changes.interests = JSON.stringify(list);
    }
    if ('emailOffers' in b) {
      // A real true/false only: the string "false" must not count as yes.
      if (typeof b.emailOffers !== 'boolean') throw new HttpError(400, 'emailOffers must be true or false.', { field: 'emailOffers' });
      changes.email_offers = b.emailOffers ? 1 : 0;
    }
    if ('hideActivity' in b) {
      if (typeof b.hideActivity !== 'boolean') throw new HttpError(400, 'hideActivity must be true or false.', { field: 'hideActivity' });
      changes.hide_activity = b.hideActivity ? 1 : 0;
      // Hiding also forgets the last visit we stored.
      if (b.hideActivity) changes.last_seen_at = null;
    }
    if ('shortName' in b) {
      if (typeof b.shortName !== 'boolean') throw new HttpError(400, 'shortName must be true or false.', { field: 'shortName' });
      // A shop is known by its name, so this is for personal accounts only.
      if (b.shortName && req.user.account_type === 'business') throw new HttpError(400, 'Shops always show their full name.', { field: 'shortName' });
      changes.short_name = b.shortName ? 1 : 0;
    }
    // Away mode (session 37): the last away day, or null for "I'm back".
    if ('awayUntil' in b) {
      const until = b.awayUntil === null ? null : v.isoDate(b, 'awayUntil');
      const last = new Date(Date.now() + MAX_AWAY_DAYS * 86_400_000).toISOString().slice(0, 10);
      if (until && (until < new Date().toISOString().slice(0, 10) || until > last)) {
        throw new HttpError(400, 'Choose a date from today up to 60 days ahead.', { field: 'awayUntil' });
      }
      setAway(db, req.user.id, until);
    }
    const cols = Object.keys(changes);
    if (cols.length) {
      db.prepare(`UPDATE users SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).run(...Object.values(changes), req.user.id);
    }
    res.json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  // Profile photo. Public, so it must never be the identity-check selfie
  // (that one stays in the private KYC folder).
  const avatarUpload = memoryUpload(1);
  r.post('/avatar', requireAuth, avatarUpload.single('avatar'), (req, res) => {
    if (!req.file) throw new HttpError(400, 'Please upload avatar.', { field: 'avatar' });
    const saved = saveFiles(AVATAR_DIR(), [{ file: req.file }]);
    const old = req.user.avatar;
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(saved.names[0], req.user.id);
    if (old) fs.rmSync(path.join(AVATAR_DIR(), old), { force: true });
    res.status(201).json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  r.delete('/avatar', requireAuth, (req, res) => {
    if (req.user.avatar) fs.rmSync(path.join(AVATAR_DIR(), req.user.avatar), { force: true });
    db.prepare('UPDATE users SET avatar = NULL WHERE id = ?').run(req.user.id);
    res.json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  // Shop cover photo (business accounts; public, wide).
  r.post('/cover', requireAuth, avatarUpload.single('cover'), (req, res) => {
    if (req.user.account_type !== 'business') throw new HttpError(400, 'Only business accounts have a shop page.');
    if (!req.file) throw new HttpError(400, 'Please upload cover.', { field: 'cover' });
    const saved = saveFiles(COVER_DIR(), [{ file: req.file }]);
    const old = req.user.cover;
    db.prepare('UPDATE users SET cover = ? WHERE id = ?').run(saved.names[0], req.user.id);
    if (old) fs.rmSync(path.join(COVER_DIR(), old), { force: true });
    res.status(201).json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  r.delete('/cover', requireAuth, (req, res) => {
    if (req.user.cover) fs.rmSync(path.join(COVER_DIR(), req.user.cover), { force: true });
    db.prepare('UPDATE users SET cover = NULL WHERE id = ?').run(req.user.id);
    res.json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  // The welcome steps were completed or skipped: don't show them again.
  r.post('/onboarded', requireAuth, (req, res) => {
    db.prepare(`UPDATE users SET onboarded_at = COALESCE(onboarded_at, datetime('now')) WHERE id = ?`).run(req.user.id);
    res.json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  return r;
}
