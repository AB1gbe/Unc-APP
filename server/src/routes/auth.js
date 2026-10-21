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

const sqlTime = (d) => d.toISOString().replace('T', ' ').slice(0, 19);

export function authRoutes(db) {
  const r = Router();

  // Slow down password guessing. Disabled in tests so tests run fast.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.isTest ? 10_000 : 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes.' },
  });

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

  r.post('/register', limiter, async (req, res) => {
    const email = v.email(req.body);
    const password = v.password(req.body);
    const displayName = v.str(req.body, 'displayName', { min: 2, max: 60 });
    const accountType = v.oneOf(req.body, 'accountType', ['individual', 'business']);
    const city = v.str(req.body, 'city', { max: 80, optional: true });

    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
      throw new HttpError(409, 'An account with this email already exists.', { field: 'email' });
    }
    const info = db.prepare(`
      INSERT INTO users (email, password_hash, display_name, account_type, city) VALUES (?, ?, ?, ?, ?)
    `).run(email, await hashPassword(password), displayName, accountType, city);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    const code = issueEmailCode(user);
    startSession(res, user.id);
    // The account exists even if the email fails; the user can resend.
    const emailSent = await trySendMail({ to: user.email, ...verificationCodeEmail(code) });
    res.status(201).json({ user: publicMe(user), emailSent, ...devExtra(code) });
  });

  r.post('/login', limiter, async (req, res) => {
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

  r.post('/verify-email', limiter, requireAuth, (req, res) => {
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

  r.post('/resend-code', limiter, requireAuth, async (req, res) => {
    if (req.user.email_verified_at) throw new HttpError(400, 'Email is already verified.');
    const code = issueEmailCode(req.user);
    if (!(await trySendMail({ to: req.user.email, ...verificationCodeEmail(code) }))) {
      throw new HttpError(502, "We couldn't send the email right now. Please try again in a minute.");
    }
    res.json({ ok: true, ...devExtra(code) });
  });

  // ---- Password reset (logged out) ----
  // Step 1: ask for a link. ALWAYS answers the same way, whether or not the
  // email has an account, so nobody can use this to discover members.
  r.post('/forgot-password', limiter, async (req, res) => {
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
      trySendMail({ to: user.email, ...passwordResetEmail(token) });
    }
    res.json({ ok: true, message: 'If an account exists for that email, a reset link is on its way.' });
  });

  function findResetToken(token) {
    const row = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(sha256(token));
    if (!row || row.used_at || row.expires_at < sqlTime(new Date())) {
      throw new HttpError(400, 'This reset link is invalid or has expired. Please request a new one.', { code: 'RESET_INVALID' });
    }
    return row;
  }

  // Lets the reset page say "link expired" before the user types a password.
  r.post('/reset-password/check', limiter, (req, res) => {
    findResetToken(v.str(req.body, 'token', { max: 200 }));
    res.json({ ok: true });
  });

  // Step 2: set the new password with the token from the email.
  r.post('/reset-password', limiter, async (req, res) => {
    const row = findResetToken(v.str(req.body, 'token', { max: 200 }));
    const password = v.password(req.body);
    const hash = await hashPassword(password);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
    tx(db, () => {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
      db.prepare(`UPDATE password_resets SET used_at = datetime('now') WHERE token_hash = ?`).run(row.token_hash);
      // Log out everywhere: whoever had the old password loses access.
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      // They clicked a link sent to their inbox, which proves they own it.
      if (!user.email_verified_at) db.prepare(`UPDATE users SET email_verified_at = datetime('now') WHERE id = ?`).run(user.id);
      audit(db, user.id, 'auth.password_reset', `user:${user.id}`);
    });
    await trySendMail({ to: user.email, ...passwordChangedEmail() });
    res.json({ ok: true });
  });

  // ---- Change password (logged in) ----
  r.post('/change-password', limiter, requireAuth, async (req, res) => {
    const current = v.str(req.body, 'currentPassword', { max: 200 });
    const password = v.password(req.body);
    if (!(await verifyPassword(current, req.user.password_hash))) {
      throw new HttpError(400, 'Your current password is not correct.', { field: 'currentPassword' });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(password), req.user.id);
    // Log out every OTHER device, keep this one.
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(req.user.id, req.sessionTokenHash);
    audit(db, req.user.id, 'auth.password_changed', `user:${req.user.id}`);
    await trySendMail({ to: req.user.email, ...passwordChangedEmail() });
    res.json({ ok: true });
  });

  r.patch('/me', requireAuth, (req, res) => {
    const displayName = v.str(req.body, 'displayName', { min: 2, max: 60 });
    const city = v.str(req.body, 'city', { max: 80, optional: true });
    db.prepare('UPDATE users SET display_name = ?, city = ? WHERE id = ?').run(displayName, city, req.user.id);
    res.json({ user: publicMe(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)) });
  });

  return r;
}
