// Rating a deal, and public member profiles with their reviews.
// (A profile has NO way to message the member: contact stays listing-only.)
import { Router } from 'express';
import { audit } from '../db.js';
import { HttpError, notFound } from '../lib/http.js';
import * as v from '../lib/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { RATE_WINDOW_DAYS, VISIBLE, canStillRate, ratingQueries } from '../lib/ratings.js';

export function ratingRoutes(db) {
  const r = Router();
  const ratings = ratingQueries(db);

  r.post('/deals/:id/rating', requireAuth, (req, res) => {
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(Number(req.params.id));
    const me = req.user.id;
    // Outsiders get 404, like conversations, so deal ids can't be probed.
    if (!deal || (deal.buyer_id !== me && deal.vendor_id !== me)) throw notFound('Deal not found.');
    if (!canStillRate(deal.created_at)) {
      throw new HttpError(409, `Ratings can only be left within ${RATE_WINDOW_DAYS} days of the deal.`);
    }
    const stars = v.int(req.body, 'stars', { min: 1, max: 5 });
    const comment = v.str(req.body, 'comment', { max: 500, optional: true });
    const ratee = deal.buyer_id === me ? deal.vendor_id : deal.buyer_id;
    try {
      db.prepare('INSERT INTO ratings (deal_id, rater_id, ratee_id, stars, comment) VALUES (?, ?, ?, ?, ?)')
        .run(deal.id, me, ratee, stars, comment);
    } catch (err) {
      if (/UNIQUE constraint failed: ratings\.deal_id, ratings\.rater_id/.test(err.message)) {
        throw new HttpError(409, 'You already rated this deal.');
      }
      throw err;
    }
    audit(db, me, 'rating.created', `deal:${deal.id}`, { stars });
    res.status(201).json({ ok: true });
  });

  r.get('/members/:id', (req, res) => {
    const m = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
    // Only verified, non-banned members have a public profile.
    if (!m || m.kyc_status !== 'approved' || (m.banned_at && req.user?.role !== 'admin')) {
      throw notFound('Member not found.');
    }
    const reviews = db.prepare(`
      SELECT r.stars, r.comment, r.created_at, u.id AS from_id, u.display_name AS from_name,
             l.title AS listing_title, CASE WHEN d.vendor_id = r.ratee_id THEN 'vendor' ELSE 'buyer' END AS role
      FROM ratings r JOIN deals d ON d.id = r.deal_id
      JOIN users u ON u.id = r.rater_id
      JOIN listings l ON l.id = d.listing_id
      WHERE r.ratee_id = ? AND ${VISIBLE}
      ORDER BY r.created_at DESC, r.id DESC LIMIT 50
    `).all(m.id);
    const { deals } = db.prepare('SELECT COUNT(*) AS deals FROM deals WHERE buyer_id = ? OR vendor_id = ?').get(m.id, m.id);
    res.json({
      member: {
        id: m.id,
        displayName: m.display_name,
        accountType: m.account_type,
        verified: true,
        memberSince: m.created_at,
        deals,
        rating: ratings.summaryFor(m.id),
      },
      reviews: reviews.map((x) => ({
        stars: x.stars,
        comment: x.comment,
        createdAt: x.created_at,
        role: x.role, // what the reviewed member was in that deal
        from: { id: x.from_id, displayName: x.from_name },
        listingTitle: x.listing_title,
      })),
    });
  });

  return r;
}
