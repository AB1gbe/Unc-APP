import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { CHAT_DIR } from '../lib/uploads.js';
import { audit, tx } from '../db.js';
import { notify } from '../lib/notify.js';
import { HttpError, notFound } from '../lib/http.js';
import * as v from '../lib/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { applyDecision } from '../kyc/index.js';
import { sendKycFile } from './kyc.js';
import { METRIC_DAYS, metrics } from '../lib/metrics.js';

export function adminRoutes(db) {
  const r = Router();
  r.use(requireAdmin);

  r.get('/stats', (_req, res) => {
    const one = (sql) => db.prepare(sql).get().n;
    res.json({
      users: one('SELECT COUNT(*) n FROM users'),
      pendingKyc: one(`SELECT COUNT(*) n FROM kyc_submissions WHERE status = 'pending'`),
      openListings: one(`SELECT COUNT(*) n FROM listings WHERE status = 'open'`),
      conversations: one('SELECT COUNT(*) n FROM conversations'),
      openReports: one(`SELECT COUNT(*) n FROM reports WHERE status = 'open'`),
    });
  });

  // The owner dashboard (session 37): ?days=7|30|90 (default 30).
  r.get('/metrics', (req, res) => {
    const days = METRIC_DAYS.includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    res.json(metrics(db, days));
  });

  // ---- KYC review queue ----
  r.get('/kyc', (req, res) => {
    const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
    const rows = db.prepare(`
      SELECT k.id, k.status, k.legal_name, k.country, k.id_type, k.submitted_at, k.reviewed_at,
             u.email, u.display_name, u.account_type
      FROM kyc_submissions k JOIN users u ON u.id = k.user_id
      WHERE k.status = ? ORDER BY k.submitted_at ASC LIMIT 200
    `).all(status);
    res.json({ submissions: rows });
  });

  r.get('/kyc/:id', (req, res) => {
    const k = db.prepare(`
      SELECT k.*, u.email, u.display_name, u.account_type, u.created_at AS user_created_at
      FROM kyc_submissions k JOIN users u ON u.id = k.user_id WHERE k.id = ?
    `).get(Number(req.params.id));
    if (!k) throw notFound();
    const history = db.prepare(`
      SELECT id, status, review_note, submitted_at, reviewed_at FROM kyc_submissions
      WHERE user_id = ? AND id <> ? ORDER BY id DESC
    `).all(k.user_id, k.id);
    // The full ID number is never stored, so it can't be shown here either.
    delete k.id_number_hash;
    const fileUrl = (f) => (k[f] ? `/api/admin/kyc/${k.id}/file/${f}` : null);
    res.json({
      submission: { ...k, files: { docFront: fileUrl('doc_front'), docBack: fileUrl('doc_back'), selfie: fileUrl('selfie'), businessDoc: fileUrl('business_doc') } },
      history,
    });
  });

  r.get('/kyc/:id/file/:field', (req, res) => {
    const allowed = ['doc_front', 'doc_back', 'selfie', 'business_doc'];
    if (!allowed.includes(req.params.field)) throw notFound();
    const k = db.prepare('SELECT * FROM kyc_submissions WHERE id = ?').get(Number(req.params.id));
    if (!k) throw notFound();
    audit(db, req.user.id, 'kyc.file_viewed', `kyc_submission:${k.id}`, { field: req.params.field });
    sendKycFile(res, k[req.params.field]);
  });

  r.post('/kyc/:id/decision', (req, res) => {
    const decision = v.oneOf(req.body, 'decision', ['approved', 'rejected']);
    const note = v.str(req.body, 'note', { max: 500, optional: decision === 'approved' });
    const k = db.prepare('SELECT * FROM kyc_submissions WHERE id = ?').get(Number(req.params.id));
    if (!k) throw notFound();
    if (k.status !== 'pending') throw new HttpError(409, 'This submission was already reviewed.');
    applyDecision(db, k.id, decision, note, req.user.id);
    res.json({ ok: true });
  });

  // ---- Reports & moderation ----
  r.get('/reports', (_req, res) => {
    const rows = db.prepare(`
      SELECT r.*, u.display_name AS reporter_name, u.email AS reporter_email, l.title AS listing_title
      FROM reports r JOIN users u ON u.id = r.reporter_id
      LEFT JOIN conversations c ON c.id = r.conversation_id
      LEFT JOIN listings l ON l.id = COALESCE(r.listing_id, c.listing_id)
      WHERE r.status = 'open' ORDER BY r.created_at ASC
    `).all();
    res.json({ reports: rows });
  });

  // Admins may read a REPORTED conversation (and only via a report).
  r.get('/reports/:id/conversation', (req, res) => {
    const rep = db.prepare('SELECT * FROM reports WHERE id = ?').get(Number(req.params.id));
    if (!rep?.conversation_id) throw notFound();
    const conv = db.prepare(`
      SELECT c.*, b.display_name AS buyer_name, b.email AS buyer_email, vu.display_name AS vendor_name, vu.email AS vendor_email
      FROM conversations c JOIN users b ON b.id = c.buyer_id JOIN users vu ON vu.id = c.vendor_id WHERE c.id = ?
    `).get(rep.conversation_id);
    const messages = db.prepare('SELECT id, sender_id, body, offer_price, image, created_at FROM messages WHERE conversation_id = ? ORDER BY id').all(rep.conversation_id)
      .map((m) => ({ ...m, image: undefined, imageUrl: m.image ? `/api/admin/reports/${rep.id}/images/${m.image}` : null }));
    audit(db, req.user.id, 'report.conversation_viewed', `report:${rep.id}`);
    res.json({ conversation: conv, messages });
  });

  // Photos in a reported conversation (admins, via the report only; logged).
  r.get('/reports/:id/images/:file', (req, res) => {
    const rep = db.prepare('SELECT * FROM reports WHERE id = ?').get(Number(req.params.id));
    const owned = rep?.conversation_id && db.prepare('SELECT 1 FROM messages WHERE conversation_id = ? AND image = ?').get(rep.conversation_id, req.params.file);
    const full = path.join(CHAT_DIR(), path.basename(req.params.file));
    if (!owned || !fs.existsSync(full)) throw notFound('File not found');
    audit(db, req.user.id, 'report.image_viewed', `report:${rep.id}`, { file: req.params.file });
    res.set('Cache-Control', 'no-store');
    res.sendFile(full);
  });

  // outcome (session 37): 'action' (we did something) or 'nothing' (found
  // nothing wrong). With an outcome, the reporter is told in the 🔔, never
  // what happened to the other person.
  r.post('/reports/:id/resolve', (req, res) => {
    const outcome = v.oneOf(req.body, 'outcome', ['action', 'nothing'], { optional: true });
    const rep = db.prepare(`
      SELECT r.*, COALESCE(r.listing_id, c.listing_id) AS about_listing FROM reports r
      LEFT JOIN conversations c ON c.id = r.conversation_id WHERE r.id = ?
    `).get(Number(req.params.id));
    if (!rep) throw notFound();
    tx(db, () => {
      db.prepare(`UPDATE reports SET status = 'resolved', outcome = ? WHERE id = ?`).run(outcome, rep.id);
      if (outcome && rep.status === 'open') {
        notify(db, rep.reporter_id, outcome === 'action' ? 'report-action' : 'report-no-action', { listingId: rep.about_listing });
      }
      audit(db, req.user.id, 'report.resolved', `report:${rep.id}`, outcome ? { outcome } : undefined);
    });
    res.json({ ok: true });
  });

  r.post('/users/:id/ban', (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user.id) throw new HttpError(400, 'You cannot ban yourself.');
    // Only a real true/false is accepted ("false" as text must not ban).
    const raw = req.body?.banned ?? true;
    if (typeof raw !== 'boolean') throw new HttpError(400, 'banned must be true or false.', { field: 'banned' });
    const banned = raw;
    const info = db.prepare(`UPDATE users SET banned_at = ${banned ? "datetime('now')" : 'NULL'} WHERE id = ?`).run(id);
    if (!info.changes) throw notFound();
    if (banned) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    audit(db, req.user.id, banned ? 'user.banned' : 'user.unbanned', `user:${id}`);
    res.json({ ok: true });
  });

  return r;
}
