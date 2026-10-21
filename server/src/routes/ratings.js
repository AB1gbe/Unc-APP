// Rating a deal, and public member profiles with their reviews.
// (A profile has NO way to message the member: contact stays listing-only.)
import { Router } from 'express';
import { audit } from '../db.js';
import { HttpError, notFound } from '../lib/http.js';
import * as v from '../lib/validate.js';
import { parseInterests, requireAuth, shopFields } from '../middleware/auth.js';
import { avatarUrl } from '../lib/uploads.js';
import { RATE_WINDOW_DAYS, VISIBLE, canStillRate, ratingQueries } from '../lib/ratings.js';
import { notify } from '../lib/notify.js';
import { activityQueries } from '../lib/activity.js';
import { badgeQueries } from '../lib/badges.js';
import { storiesAbout } from './stories.js';

export function ratingRoutes(db) {
  const r = Router();
  const ratings = ratingQueries(db);
  const activity = activityQueries(db);
  const badgesFor = badgeQueries(db, ratings, activity);

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
    notify(db, ratee, 'rating', { actorId: me, listingId: deal.listing_id, conversationId: deal.conversation_id });
    res.status(201).json({ ok: true });
  });

  r.get('/members/:id', (req, res) => {
    const m = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
    // Only verified, non-banned members have a public profile.
    if (!m || m.kyc_status !== 'approved' || (m.banned_at && req.user?.role !== 'admin')) {
      throw notFound('Member not found.');
    }
    const reviews = db.prepare(`
      SELECT r.stars, r.comment, r.created_at, u.id AS from_id, u.display_name AS from_name, u.avatar AS from_avatar,
             l.title AS listing_title, CASE WHEN d.vendor_id = r.ratee_id THEN 'vendor' ELSE 'buyer' END AS role
      FROM ratings r JOIN deals d ON d.id = r.deal_id
      JOIN users u ON u.id = r.rater_id
      JOIN listings l ON l.id = d.listing_id
      WHERE r.ratee_id = ? AND ${VISIBLE}
      ORDER BY r.created_at DESC, r.id DESC LIMIT 50
    `).all(m.id);
    const { deals } = db.prepare('SELECT COUNT(*) AS deals FROM deals WHERE buyer_id = ? OR vendor_id = ?').get(m.id, m.id);
    // Their open requests, newest first (the same cards as Browse).
    const openRequests = db.prepare(`
      SELECT id, title, category, budget_min, budget_max, currency, city, created_at
      FROM listings WHERE buyer_id = ? AND status = 'open' ORDER BY created_at DESC, id DESC LIMIT 6
    `).all(m.id).map((l) => ({
      id: l.id, title: l.title, category: l.category, budgetMin: l.budget_min, budgetMax: l.budget_max,
      currency: l.currency, city: l.city, createdAt: l.created_at, description: '',
    }));
    res.json({
      member: {
        id: m.id,
        displayName: m.display_name,
        accountType: m.account_type,
        verified: true,
        memberSince: m.created_at,
        avatarUrl: avatarUrl(m.avatar),
        bio: m.bio,
        city: m.city,
        interests: parseInterests(m.interests),
        deals,
        rating: ratings.summaryFor(m.id),
        activity: req.user ? activity.summaryFor(m.id) : undefined,
        badges: badgesFor(m.id),
        ...shopFields(m),
        favouriteCount: db.prepare('SELECT COUNT(*) AS n FROM favourites WHERE seller_id = ?').get(m.id).n,
        favourite: req.user ? Boolean(db.prepare('SELECT 1 FROM favourites WHERE user_id = ? AND seller_id = ?').get(req.user.id, m.id)) : undefined,
      },
      stories: storiesAbout(db, m.id),
      openRequests,
      reviews: reviews.map((x) => ({
        stars: x.stars,
        comment: x.comment,
        createdAt: x.created_at,
        role: x.role, // what the reviewed member was in that deal
        from: { id: x.from_id, displayName: x.from_name, avatarUrl: avatarUrl(x.from_avatar) },
        listingTitle: x.listing_title,
      })),
    });
  });

  return r;
}
