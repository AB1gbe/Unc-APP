// The business panel (session 88, ADR-077): for business accounts only.
//   GET  /api/business/dashboard      views, replies and offers, this week vs last
//   GET  /api/business/ads            every ad and request with its numbers
//   GET  /api/business/billing        prices, packs, ad credit, card, payments
//   POST /api/business/billing/packs  buy a pack of ad credit (owner only)
//   GET  /api/business/billing/receipts/:id
// Team members (step 4) use the same panel while "acting as" the business;
// some things stay with the owner (buying, the team itself).
import { Router } from 'express';
import { audit, tx } from '../db.js';
import * as v from '../lib/validate.js';
import { notify } from '../lib/notify.js';
import { trySendMail } from '../lib/mailer.js';
import { teamInviteEmail } from '../lib/emails.js';
import { startSession } from '../lib/sessions.js';
import { avatarUrl } from '../lib/uploads.js';
import { SESSION_COOKIE, requireAuth } from '../middleware/auth.js';
import { HttpError, notFound } from '../lib/http.js';
import { requireVerified } from '../middleware/auth.js';
import { AD_PRICES, PACKS, buyPack, creditOf, paymentView } from '../lib/billing.js';
import { cardView } from './payments.js';

export function requireBusiness(req, res, next) {
  requireVerified(req, res, (err) => {
    if (err) return next(err);
    if (req.user.account_type !== 'business') return next(new HttpError(403, 'This is for business accounts.'));
    next();
  });
}

// Things only the business owner may do, not a team member acting for it.
export function ownerOnly(req, _res, next) {
  if (req.actorId) return next(new HttpError(403, 'Only the business owner can do this.'));
  next();
}

export function businessRoutes(db) {
  const r = Router();
  r.use('/business', requireBusiness);

  // This week = the last 7 days up to now (and anything later in the same
  // second); last week = the 7 days before that.
  const week = (offset) => [`datetime('now', '-${7 * (offset + 1)} days')`, offset ? `datetime('now', '-${7 * offset} days')` : `datetime('now', '+1 day')`];
  const between = (col, offset) => { const [a, b] = week(offset); return `${col} >= ${a} AND ${col} < ${b}`; };

  r.get('/business/dashboard', (req, res) => {
    const id = req.user.id;
    const count = (sql) => db.prepare(sql).get(id).n;
    const period = (offset) => ({
      views: count(`SELECT COUNT(*) AS n FROM listing_views v JOIN listings l ON l.id = v.listing_id WHERE l.buyer_id = ? AND ${between('v.first_seen_at', offset)}`),
      replies: count(`SELECT COUNT(*) AS n FROM conversations c JOIN listings l ON l.id = c.listing_id WHERE l.buyer_id = ? AND ${between('c.created_at', offset)}`),
      offersSent: count(`SELECT COUNT(*) AS n FROM conversations c WHERE c.vendor_id = ? AND ${between('c.created_at', offset)}`),
      adsPosted: count(`SELECT COUNT(*) AS n FROM listings l WHERE l.buyer_id = ? AND ${between('l.created_at', offset)}`),
    });
    res.json({
      thisWeek: period(0),
      lastWeek: period(1),
      openAds: count(`SELECT COUNT(*) AS n FROM listings WHERE buyer_id = ? AND status = 'open'`),
      unread: db.prepare(`SELECT COUNT(*) AS n FROM messages m JOIN conversations c ON c.id = m.conversation_id
        WHERE (c.buyer_id = ? OR c.vendor_id = ?) AND m.sender_id <> ? AND m.read_at IS NULL`).get(id, id, id).n,
      credit: creditOf(db, id),
    });
  });

  r.get('/business/ads', (req, res) => {
    const rows = db.prepare(`
      SELECT l.id, l.title, l.section, l.category, l.status, l.budget_min, l.budget_max, l.currency, l.city, l.created_at, l.held_at, l.paid_fils,
             (SELECT COUNT(*) FROM listing_views v WHERE v.listing_id = l.id) AS views,
             (SELECT COUNT(*) FROM conversations c WHERE c.listing_id = l.id) AS replies,
             (SELECT file FROM listing_images i WHERE i.listing_id = l.id ORDER BY i.id LIMIT 1) AS photo,
             p.display_name AS posted_by_name
      FROM listings l LEFT JOIN users p ON p.id = l.posted_by
      WHERE l.buyer_id = ? ORDER BY (l.status = 'open') DESC, l.created_at DESC, l.id DESC LIMIT 200
    `).all(req.user.id);
    res.json({ ads: rows.map((a) => ({
      id: a.id, title: a.title, section: a.section, category: a.category, status: a.status, held: Boolean(a.held_at),
      budgetMin: a.budget_min, budgetMax: a.budget_max, currency: a.currency, city: a.city, createdAt: a.created_at,
      views: a.views, replies: a.replies, paid: a.paid_fils, photoUrl: a.photo ? `/uploads/listings/${a.photo}` : null, postedBy: a.posted_by_name,
    })) });
  });

  const paymentsOf = db.prepare(`
    SELECT p.*, l.title AS listing_title, a.display_name AS actor_name FROM ad_payments p
    LEFT JOIN listings l ON l.id = p.listing_id LEFT JOIN users a ON a.id = p.actor_id
    WHERE p.user_id = ? ORDER BY p.created_at DESC, p.id DESC LIMIT 100
  `);
  r.get('/business/billing', (req, res) => {
    res.json({
      prices: AD_PRICES,
      packs: PACKS,
      credit: creditOf(db, req.user.id),
      card: cardView(db.prepare('SELECT * FROM payment_cards WHERE user_id = ?').get(req.user.id)),
      payments: paymentsOf.all(req.user.id).map(paymentView),
      isOwner: !req.actorId,
    });
  });

  r.post('/business/billing/packs', ownerOnly, async (req, res) => {
    const paymentId = await buyPack(db, req.user, null, req.body?.pack);
    audit(db, req.user.id, 'billing.pack', `payment:${paymentId}`, { pack: req.body.pack });
    const p = db.prepare('SELECT * FROM ad_payments WHERE id = ?').get(paymentId);
    res.status(201).json({ payment: paymentView(p), credit: creditOf(db, req.user.id) });
  });

  r.get('/business/billing/receipts/:id', (req, res) => {
    const p = db.prepare(`
      SELECT p.*, l.title AS listing_title, a.display_name AS actor_name FROM ad_payments p
      LEFT JOIN listings l ON l.id = p.listing_id LEFT JOIN users a ON a.id = p.actor_id
      WHERE p.id = ? AND p.user_id = ?
    `).get(Number(req.params.id), req.user.id);
    if (!p) throw notFound('Receipt not found.');
    const k = db.prepare(`SELECT business_name, business_reg_number FROM kyc_submissions WHERE user_id = ? AND status = 'approved' ORDER BY id DESC LIMIT 1`).get(req.user.id);
    res.json({ receipt: { ...paymentView(p), business: { name: k?.business_name ?? req.user.display_name, cr: k?.business_reg_number ?? null } } });
  });

  // ---- Team (owner side) ----
  const MAX_TEAM = 10;
  r.get('/business/team', ownerOnly, (req, res) => {
    const members = db.prepare(`
      SELECT u.id, u.display_name, u.email, u.avatar, m.created_at FROM team_members m JOIN users u ON u.id = m.user_id
      WHERE m.business_id = ? ORDER BY m.created_at
    `).all(req.user.id).map((m) => ({ id: m.id, displayName: m.display_name, email: m.email, avatarUrl: avatarUrl(m.avatar), addedAt: m.created_at }));
    const invites = db.prepare('SELECT id, email, created_at FROM team_invites WHERE business_id = ? ORDER BY created_at').all(req.user.id)
      .map((i) => ({ id: i.id, email: i.email, sentAt: i.created_at }));
    res.json({ members, invites, max: MAX_TEAM });
  });

  r.post('/business/team/invites', ownerOnly, (req, res) => {
    const email = v.email(req.body);
    if (email === req.user.email) throw new HttpError(400, 'You are already the owner of this business.', { field: 'email' });
    const size = db.prepare('SELECT (SELECT COUNT(*) FROM team_members WHERE business_id = ?) + (SELECT COUNT(*) FROM team_invites WHERE business_id = ?) AS n').get(req.user.id, req.user.id).n;
    if (size >= MAX_TEAM) throw new HttpError(409, 'A team can have up to 10 people.');
    const member = db.prepare('SELECT u.id FROM users u JOIN team_members m ON m.user_id = u.id WHERE u.email = ? AND m.business_id = ?').get(email, req.user.id);
    if (member) throw new HttpError(409, 'This person is already on your team.', { field: 'email' });
    db.prepare('INSERT OR IGNORE INTO team_invites (business_id, email) VALUES (?, ?)').run(req.user.id, email);
    const invitee = db.prepare('SELECT id, language FROM users WHERE email = ?').get(email);
    if (invitee) notify(db, invitee.id, 'team-invite', { actorId: req.user.id });
    trySendMail({ to: email, ...teamInviteEmail(req.user.display_name, invitee?.language ?? req.user.language) });
    audit(db, req.user.id, 'team.invited', `user:${req.user.id}`, { email });
    res.status(201).json({ ok: true });
  });

  r.delete('/business/team/invites/:id', ownerOnly, (req, res) => {
    db.prepare('DELETE FROM team_invites WHERE id = ? AND business_id = ?').run(Number(req.params.id), req.user.id);
    res.json({ ok: true });
  });

  // Removing someone also logs them out of the business at once.
  r.delete('/business/team/members/:userId', ownerOnly, (req, res) => {
    const userId = Number(req.params.userId);
    tx(db, () => {
      db.prepare('DELETE FROM team_members WHERE business_id = ? AND user_id = ?').run(req.user.id, userId);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND actor_id = ?').run(req.user.id, userId);
      audit(db, req.user.id, 'team.removed', `user:${userId}`);
    });
    res.json({ ok: true });
  });

  // ---- Team (member side): any logged-in member ----
  const myInvites = db.prepare(`
    SELECT i.id, i.business_id, u.display_name, u.avatar FROM team_invites i JOIN users u ON u.id = i.business_id
    WHERE i.email = ? AND u.banned_at IS NULL ORDER BY i.created_at
  `);
  r.get('/team', requireAuth, (req, res) => {
    const me = req.actorId ?? req.user.id;
    const email = db.prepare('SELECT email, email_verified_at FROM users WHERE id = ?').get(me);
    const businesses = db.prepare(`
      SELECT u.id, u.display_name, u.avatar FROM team_members m JOIN users u ON u.id = m.business_id
      WHERE m.user_id = ? AND u.banned_at IS NULL ORDER BY u.display_name
    `).all(me).map((b) => ({ id: b.id, displayName: b.display_name, avatarUrl: avatarUrl(b.avatar) }));
    const invites = email.email_verified_at ? myInvites.all(email.email).map((i) => ({ id: i.id, business: { id: i.business_id, displayName: i.display_name, avatarUrl: avatarUrl(i.avatar) } })) : [];
    res.json({ businesses, invites, actingFor: req.actorId ? { id: req.user.id, displayName: req.user.display_name } : null, emailVerified: Boolean(email.email_verified_at) });
  });

  const ownInvite = (req) => {
    if (req.actorId) throw new HttpError(403, 'Switch back to your own account first.');
    if (!req.user.email_verified_at) throw new HttpError(403, 'Please verify your email address first.', { code: 'EMAIL_UNVERIFIED' });
    const invite = db.prepare('SELECT * FROM team_invites WHERE id = ? AND email = ?').get(Number(req.params.id), req.user.email);
    if (!invite) throw notFound('Invitation not found.');
    return invite;
  };
  r.post('/team/invites/:id/accept', requireAuth, (req, res) => {
    const invite = ownInvite(req);
    if (invite.business_id === req.user.id) throw new HttpError(400, 'You are already the owner of this business.');
    tx(db, () => {
      db.prepare('INSERT OR IGNORE INTO team_members (business_id, user_id) VALUES (?, ?)').run(invite.business_id, req.user.id);
      db.prepare('DELETE FROM team_invites WHERE id = ?').run(invite.id);
      audit(db, req.user.id, 'team.joined', `user:${invite.business_id}`);
    });
    res.json({ ok: true });
  });
  r.post('/team/invites/:id/decline', requireAuth, (req, res) => {
    const invite = ownInvite(req);
    db.prepare('DELETE FROM team_invites WHERE id = ?').run(invite.id);
    res.json({ ok: true });
  });
  // Leave a team (from my own account).
  r.delete('/team/:businessId', requireAuth, (req, res) => {
    if (req.actorId) throw new HttpError(403, 'Switch back to your own account first.');
    const businessId = Number(req.params.businessId);
    db.prepare('DELETE FROM team_members WHERE business_id = ? AND user_id = ?').run(businessId, req.user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND actor_id = ?').run(businessId, req.user.id);
    res.json({ ok: true });
  });

  // Switch to the business: a new session as the business, remembering
  // who is really using it. The old session (own account) ends.
  r.post('/team/switch/:businessId', requireAuth, (req, res) => {
    if (req.actorId) throw new HttpError(403, 'Switch back to your own account first.');
    const businessId = Number(req.params.businessId);
    const ok = db.prepare(`
      SELECT 1 FROM team_members m JOIN users u ON u.id = m.business_id WHERE m.business_id = ? AND m.user_id = ? AND u.banned_at IS NULL
    `).get(businessId, req.user.id);
    if (!ok) throw new HttpError(403, 'You are not on this business team.');
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.sessionTokenHash);
    startSession(db, res, businessId, req.user.id);
    audit(db, req.user.id, 'team.switched', `user:${businessId}`);
    res.json({ ok: true });
  });
  r.post('/team/switch-back', requireAuth, (req, res) => {
    if (!req.actorId) return res.json({ ok: true });
    const actor = db.prepare('SELECT id, banned_at FROM users WHERE id = ?').get(req.actorId);
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.sessionTokenHash);
    if (!actor || actor.banned_at) { res.clearCookie(SESSION_COOKIE, { path: '/' }); return res.json({ ok: true, loggedOut: true }); }
    startSession(db, res, actor.id);
    res.json({ ok: true });
  });

  return r;
}
