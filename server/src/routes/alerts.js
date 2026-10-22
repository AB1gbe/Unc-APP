// Request alerts (session 31): a seller saves a search, e.g. "Electronics
// in Manama, budget at least 100", and hears about every matching new
// request (🔔 + phone push). They answer through the request, as always.
import { Router } from 'express';
import { HttpError, notFound } from '../lib/http.js';
import { CATEGORIES } from '../lib/categories.js';
import { notify } from '../lib/notify.js';
import { pushTo } from '../lib/push.js';
import * as v from '../lib/validate.js';
import { requireAuth } from '../middleware/auth.js';

const MAX_ALERTS = 10;
const view = (a) => ({ id: a.id, q: a.q, category: a.category, city: a.city, minBudget: a.min_budget, createdAt: a.created_at });

export function alertRoutes(db) {
  const r = Router();

  r.get('/', requireAuth, (req, res) => {
    res.json({ alerts: db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY id DESC').all(req.user.id).map(view) });
  });

  r.post('/', requireAuth, (req, res) => {
    const q = v.str(req.body, 'q', { max: 80, optional: true });
    const category = req.body?.category ? v.oneOf(req.body, 'category', CATEGORIES) : null;
    const city = v.str(req.body, 'city', { max: 80, optional: true });
    const minBudget = v.int(req.body, 'minBudget', { optional: true });
    if (!q && !category && !city && minBudget == null) throw new HttpError(400, 'Choose at least one thing to watch for: words, a category, a city or a budget.');
    if (db.prepare('SELECT COUNT(*) AS n FROM alerts WHERE user_id = ?').get(req.user.id).n >= MAX_ALERTS) {
      throw new HttpError(400, `You can have up to ${MAX_ALERTS} alerts. Delete one first.`);
    }
    const info = db.prepare('INSERT INTO alerts (user_id, q, category, city, min_budget) VALUES (?, ?, ?, ?, ?)').run(req.user.id, q, category, city, minBudget);
    res.status(201).json({ alert: view(db.prepare('SELECT * FROM alerts WHERE id = ?').get(info.lastInsertRowid)) });
  });

  r.delete('/:id', requireAuth, (req, res) => {
    const { changes } = db.prepare('DELETE FROM alerts WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
    if (!changes) throw notFound('Alert not found.');
    res.json({ ok: true });
  });

  return r;
}

// Does this alert match the new request? Words: every word must appear in
// the title or description. City: contained, ignoring case. Budget: the
// buyer's top budget (or their only number) must reach minBudget; requests
// without a budget still match.
export function alertMatches(a, l) {
  if (a.category && a.category !== l.category) return false;
  if (a.city && !(l.city || '').toLowerCase().includes(a.city.toLowerCase())) return false;
  if (a.min_budget != null) {
    const top = l.budget_max ?? l.budget_min;
    if (top != null && top < a.min_budget) return false;
  }
  if (a.q) {
    const text = `${l.title} ${l.description || ''}`.toLowerCase();
    if (!a.q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => text.includes(w))) return false;
  }
  return true;
}

// Called after a request is created. `skip`: members already told about it
// (favourite sellers), so nobody gets two notifications for one request.
export function tellAlerts(db, buyer, listing, skip = new Set()) {
  const alerts = db.prepare(`
    SELECT a.* FROM alerts a JOIN users u ON u.id = a.user_id
    WHERE (a.category IS NULL OR a.category = ?) AND a.user_id <> ?
      AND u.kyc_status = 'approved' AND u.banned_at IS NULL
  `).all(listing.category, buyer.id);
  const told = new Set(skip);
  for (const a of alerts) {
    if (told.has(a.user_id) || !alertMatches(a, listing)) continue;
    told.add(a.user_id);
    notify(db, a.user_id, 'alert-match', { listingId: listing.id });
    pushTo(db, a.user_id, 'alert-match', { title: listing.title, city: listing.city }, `/requests/${listing.id}`)
      .catch((err) => console.warn('[push]', err.message));
  }
  return told;
}
