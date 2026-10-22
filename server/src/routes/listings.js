// "Listings" are REQUESTS posted by buyers: "I want X". Vendors browse them
// and reach out about a specific one (see conversations.js).
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { audit, tx } from '../db.js';
import { HttpError, notFound } from '../lib/http.js';
import { LISTING_DIR, avatarUrl, memoryUpload, saveFiles } from '../lib/uploads.js';
import { CATEGORIES, CURRENCIES } from '../lib/categories.js';
import * as v from '../lib/validate.js';
import { parseInterests, requireAuth, requireVerified } from '../middleware/auth.js';
import { ratingQueries } from '../lib/ratings.js';
import { notify, thankOtherSellers } from '../lib/notify.js';
import { activityQueries } from '../lib/activity.js';
import { badgeQueries } from '../lib/badges.js';
import { tellFavourites } from './favourites.js';
import { tellAlerts } from './alerts.js';
import { areasOf, governorateNamed, normalizeCity } from '../../../shared/areas.js';
import { NOT_BLOCKED_BUYER } from '../lib/blocks.js';
import { EXPIRES_AT_SQL } from '../lib/expiry.js';
import { CONTACT_ALLOWED_SQL, CONTACT_RULES, contactAllowedParams, contactBlocker } from '../lib/contact.js';
import { NOT_AWAY } from '../lib/activity.js';
import { nameFor } from '../../../shared/names.js';

export const MAX_PHOTOS = 6;

// images: [{ id, file }] in display order
export function listingView(row, images = []) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    currency: row.currency,
    city: row.city,
    neededBy: row.needed_by,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contactRule: row.contact_rule ?? 'anyone',
    buyer: { id: row.buyer_id, displayName: nameFor(row.buyer_name, row.buyer_short), accountType: row.buyer_type, avatarUrl: avatarUrl(row.buyer_avatar) },
    images: images.map((i) => `/uploads/listings/${i.file}`),
    photos: images.map((i) => ({ id: i.id, url: `/uploads/listings/${i.file}` })),
    offerCount: row.offer_count ?? undefined,
  };
}

const BASE_SELECT = `
  SELECT l.*, u.display_name AS buyer_name, u.account_type AS buyer_type, u.avatar AS buyer_avatar, u.short_name AS buyer_short, u.banned_at IS NOT NULL AS buyer_banned,
         (SELECT COUNT(*) FROM conversations c WHERE c.listing_id = l.id) AS offer_count
  FROM listings l JOIN users u ON u.id = l.buyer_id
`;

export function listingRoutes(db) {
  const r = Router();
  const upload = memoryUpload(MAX_PHOTOS);
  const imagesFor = db.prepare('SELECT id, file FROM listing_images WHERE listing_id = ? ORDER BY id');
  const withImages = (row) => listingView(row, imagesFor.all(row.id));
  const ratings = ratingQueries(db);
  const activity = activityQueries(db);
  const viewCount = db.prepare('SELECT COUNT(*) AS n FROM listing_views WHERE listing_id = ?');
  const badgesFor = badgeQueries(db, ratings, activity);

  // The full single-request view: adds the buyer's rating and, for the
  // owner, which conversation the deal was made in.
  function detailView(id, me) {
    const listing = withImages(db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(id));
    listing.buyer.rating = ratings.summaryFor(listing.buyer.id);
    listing.buyer.badges = badgesFor(listing.buyer.id);
    if (me) listing.buyer.activity = activity.summaryFor(listing.buyer.id);
    if (me?.id === listing.buyer.id) {
      listing.viewCount = viewCount.get(id).n;
      listing.expiresAt = db.prepare(`SELECT ${EXPIRES_AT_SQL} AS at FROM listings WHERE id = ?`).get(id).at;
      listing.expiredAt = db.prepare('SELECT expired_at FROM listings WHERE id = ?').get(id).expired_at;
      listing.dealConversationId = db.prepare('SELECT conversation_id FROM deals WHERE listing_id = ?').get(id)?.conversation_id ?? null;
    }
    return listing;
  }

  // Public browse + search. Only open requests are shown.
  r.get('/', (req, res) => {
    const where = [`l.status = 'open'`, 'u.banned_at IS NULL'];
    const params = [];
    if (req.user) { where.push(NOT_BLOCKED_BUYER); params.push(req.user.id); }
    if (req.query.q) {
      where.push('(l.title LIKE ? OR l.description LIKE ?)');
      const like = `%${String(req.query.q).slice(0, 100)}%`;
      params.push(like, like);
    }
    if (req.query.category && CATEGORIES.includes(req.query.category)) {
      where.push('l.category = ?');
      params.push(req.query.category);
    }
    if (req.query.city) {
      // A whole governorate ("Capital Governorate") searches all its areas;
      // a known area matches however it was spelled (session 31).
      const gov = governorateNamed(String(req.query.city));
      if (gov) {
        const areas = areasOf(gov);
        where.push(`l.city IN (${areas.map(() => '?').join(', ')})`);
        params.push(...areas);
      } else {
        where.push('l.city LIKE ?');
        params.push(`%${normalizeCity(String(req.query.city).slice(0, 80))}%`);
      }
    }
    // Capped so absurd page numbers can't overflow the OFFSET.
    const page = Math.min(10_000, Math.max(1, Number.parseInt(req.query.page, 10) || 1));
    const pageSize = 20;
    const rows = db.prepare(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY l.created_at DESC, l.id DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize + 1, (page - 1) * pageSize);
    res.json({
      listings: rows.slice(0, pageSize).map(withImages),
      page,
      hasMore: rows.length > pageSize,
    });
  });

  // "Requests you could help with" on the member's home page: open
  // requests in their interests (all categories if they chose none), not
  // their own, not ones they already answered; same city first, newest first.
  r.get('/for-you', requireAuth, (req, res) => {
    const interests = parseInterests(req.user.interests).filter((c) => CATEGORIES.includes(c));
    const rows = db.prepare(`
      ${BASE_SELECT}
      WHERE l.status = 'open' AND u.banned_at IS NULL AND l.buyer_id <> ? AND ${NOT_BLOCKED_BUYER}
        AND ${CONTACT_ALLOWED_SQL}
        AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.listing_id = l.id AND c.vendor_id = ?)
        ${interests.length ? `AND l.category IN (${interests.map(() => '?').join(', ')})` : ''}
      ORDER BY (lower(l.city) = lower(COALESCE(?, ''))) DESC, l.created_at DESC, l.id DESC
      LIMIT 6
    `).all(req.user.id, req.user.id, ...contactAllowedParams(db, req.user), req.user.id, ...interests, req.user.city);
    res.json({ listings: rows.map(withImages), basedOnInterests: interests.length > 0 });
  });

  // The member's saved requests ("♥ Save"), newest saved first. Only ones
  // that are still open are listed; closed ones stay saved but hidden.
  r.get('/saved', requireAuth, (req, res) => {
    const rows = db.prepare(`
      ${BASE_SELECT} JOIN saved_listings s ON s.listing_id = l.id AND s.user_id = ?
      WHERE l.status = 'open' AND u.banned_at IS NULL
      ORDER BY s.created_at DESC, l.id DESC
      LIMIT 100
    `).all(req.user.id);
    res.json({ listings: rows.map(withImages) });
  });

  r.put('/:id/save', requireAuth, (req, res) => {
    const row = db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(Number(req.params.id));
    if (!row || row.buyer_banned || row.status !== 'open') throw notFound('This request does not exist or is no longer open.');
    if (row.buyer_id === req.user.id) throw new HttpError(400, "You can't save your own request.");
    db.prepare('INSERT OR IGNORE INTO saved_listings (user_id, listing_id) VALUES (?, ?)').run(req.user.id, row.id);
    res.json({ saved: true });
  });

  r.delete('/:id/save', requireAuth, (req, res) => {
    db.prepare('DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?').run(req.user.id, Number(req.params.id));
    res.json({ saved: false });
  });

  // The logged-in buyer's own requests, any status.
  r.get('/mine', requireAuth, (req, res) => {
    const rows = db.prepare(`${BASE_SELECT} WHERE l.buyer_id = ? ORDER BY l.created_at DESC, l.id DESC`).all(req.user.id);
    res.json({ listings: rows.map((row) => ({ ...withImages(row), viewCount: viewCount.get(row.id).n })) });
  });

  r.get('/:id', (req, res) => {
    const row = db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(Number(req.params.id));
    const me = req.user;
    const isAdmin = me?.role === 'admin';
    const isOwner = row && me?.id === row.buyer_id;
    // Vendors who talked to the buyer about it may still open it after it closes.
    const isParticipant = row && me && db.prepare('SELECT 1 FROM conversations WHERE listing_id = ? AND vendor_id = ?').get(row.id, me.id);
    const hidden = !row
      || (row.buyer_banned && !isAdmin)                                  // banned buyer: gone for everyone
      || (row.status !== 'open' && !isOwner && !isParticipant && !isAdmin); // closed: owner, its vendors, admins
    if (hidden) throw notFound('This request does not exist or is no longer open.');
    // "👀 Seen by N people": count each logged-in member once (not the buyer).
    if (me && me.id !== row.buyer_id) {
      db.prepare('INSERT OR IGNORE INTO listing_views (listing_id, user_id) VALUES (?, ?)').run(row.id, me.id);
    }
    const listing = detailView(row.id, me);
    // Tell a vendor whether they've already reached out about this one.
    if (req.user && req.user.id !== row.buyer_id) {
      const conv = db.prepare('SELECT id FROM conversations WHERE listing_id = ? AND vendor_id = ?').get(row.id, req.user.id);
      listing.myConversationId = conv?.id ?? null;
      listing.saved = Boolean(db.prepare('SELECT 1 FROM saved_listings WHERE user_id = ? AND listing_id = ?').get(req.user.id, row.id));
      // Which rule stops me making an offer, if any (session 34).
      listing.contactBlocked = conv ? null : contactBlocker(db, row, req.user);
    }
    res.json({ listing });
  });

  r.post('/', requireVerified, upload.array('images', MAX_PHOTOS), (req, res) => {
    const data = readListingBody(req.body);
    // All photos are checked before anything is saved, and the listing +
    // photo rows are written in one transaction: a bad photo means nothing
    // is created (no half-made listing that a retry would duplicate).
    const photos = saveFiles(LISTING_DIR(), (req.files || []).map((file) => ({ file })));
    let id;
    try {
      id = tx(db, () => {
        const info = db.prepare(`
          INSERT INTO listings (buyer_id, title, description, category, budget_min, budget_max, currency, city, needed_by, contact_rule)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(req.user.id, data.title, data.description, data.category, data.budgetMin, data.budgetMax,
          data.currency, data.city, data.neededBy, data.contactRule);
        const newId = Number(info.lastInsertRowid);
        for (const name of photos.names) {
          db.prepare('INSERT INTO listing_images (listing_id, file) VALUES (?, ?)').run(newId, name);
        }
        audit(db, req.user.id, 'listing.created', `listing:${newId}`);
        return newId;
      });
    } catch (err) {
      photos.discard();
      throw err;
    }
    // Sellers who were favourited by this buyer hear about it first.
    // Then everyone whose request alert matches (session 31), once each.
    const told = tellFavourites(db, req.user, { id, title: data.title, category: data.category, contact_rule: data.contactRule, buyer_id: req.user.id });
    tellAlerts(db, req.user, {
      id, title: data.title, description: data.description, category: data.category, city: data.city,
      budget_min: data.budgetMin, budget_max: data.budgetMax, contact_rule: data.contactRule, buyer_id: req.user.id,
    }, told);
    res.status(201).json({ listing: withImages(db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(id)) });
  });

  r.patch('/:id', requireVerified, (req, res) => {
    const row = ownListing(db, req);
    if (row.status !== 'open') throw new HttpError(409, 'Only open requests can be edited.');
    const data = readListingBody(req.body);
    db.prepare(`
      UPDATE listings SET title = ?, description = ?, category = ?, budget_min = ?, budget_max = ?, currency = ?,
        city = ?, needed_by = ?, contact_rule = ?, updated_at = datetime('now') WHERE id = ?
    `).run(data.title, data.description, data.category, data.budgetMin, data.budgetMax, data.currency,
      data.city, data.neededBy, data.contactRule, row.id);
    res.json({ listing: withImages(db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(row.id)) });
  });

  // Mark as fulfilled / closed / reopen. Once not open, all its
  // conversations become read-only.
  // Add photos to an open request (owner only), up to MAX_PHOTOS in total.
  r.post('/:id/images', requireVerified, upload.array('images', MAX_PHOTOS), (req, res) => {
    const row = ownListing(db, req);
    if (row.status !== 'open') throw new HttpError(409, 'Only open requests can be edited.');
    const files = req.files || [];
    if (!files.length) throw new HttpError(400, 'Please upload images.', { field: 'images' });
    const have = db.prepare('SELECT COUNT(*) AS n FROM listing_images WHERE listing_id = ?').get(row.id).n;
    if (have + files.length > MAX_PHOTOS) {
      throw new HttpError(400, `A request can have at most ${MAX_PHOTOS} photos.`, { field: 'images' });
    }
    const photos = saveFiles(LISTING_DIR(), files.map((file) => ({ file })));
    try {
      tx(db, () => {
        for (const name of photos.names) db.prepare('INSERT INTO listing_images (listing_id, file) VALUES (?, ?)').run(row.id, name);
      });
    } catch (err) {
      photos.discard();
      throw err;
    }
    res.status(201).json({ listing: detailView(row.id, req.user) });
  });

  r.delete('/:id/images/:imageId', requireAuth, (req, res) => {
    const row = ownListing(db, req);
    const img = db.prepare('SELECT * FROM listing_images WHERE id = ? AND listing_id = ?').get(Number(req.params.imageId), row.id);
    if (!img) throw notFound('File not found');
    db.prepare('DELETE FROM listing_images WHERE id = ?').run(img.id);
    fs.rmSync(path.join(LISTING_DIR(), img.file), { force: true });
    res.json({ listing: detailView(row.id, req.user) });
  });

  // When marking "fulfilled" the buyer may say which conversation the deal
  // came from (conversationId). That records a DEAL, which both sides can
  // then rate. Leave it out if they found the item elsewhere.
  // "Keep it open" (session 31): another 30 days for an open request.
  r.post('/:id/renew', requireAuth, (req, res) => {
    const row = ownListing(db, req);
    if (row.status !== 'open') throw new HttpError(409, 'Only open requests can be kept open. Reopen it instead.');
    db.prepare(`UPDATE listings SET renewed_at = datetime('now'), expiry_reminded_at = NULL WHERE id = ?`).run(row.id);
    res.json({ listing: detailView(row.id, req.user) });
  });

  // "Raise my budget" (session 37): once a day, the buyer raises the top of
  // the budget, and sellers who looked at or saved the request (and may
  // still answer it) hear about it. 🔔 only.
  r.post('/:id/budget', requireVerified, (req, res) => {
    const row = ownListing(db, req);
    if (row.status !== 'open') throw new HttpError(409, 'Only open requests can be edited.');
    const budgetMax = v.int(req.body, 'budgetMax', { min: 1 });
    if (budgetMax <= (row.budget_max ?? row.budget_min ?? 0)) throw new HttpError(400, 'The new budget must be higher than the current one.', { field: 'budgetMax' });
    if (row.budget_raised_at && Date.parse(`${row.budget_raised_at.replace(' ', 'T')}Z`) > Date.now() - 86_400_000) {
      throw new HttpError(409, 'You can raise the budget once a day.');
    }
    const sellers = db.prepare(`
      SELECT u.id, u.account_type FROM users u
      WHERE u.id IN (SELECT user_id FROM listing_views WHERE listing_id = ? UNION SELECT user_id FROM saved_listings WHERE listing_id = ?)
        AND u.id <> ? AND u.banned_at IS NULL AND u.kyc_status = 'approved' AND ${NOT_AWAY}
        AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.listing_id = ? AND c.vendor_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.user_id = ? AND b.blocked_id = u.id) OR (b.user_id = u.id AND b.blocked_id = ?))
    `).all(row.id, row.id, row.buyer_id, row.id, row.buyer_id, row.buyer_id).filter((s) => !contactBlocker(db, row, s));
    tx(db, () => {
      db.prepare(`UPDATE listings SET budget_max = ?, budget_raised_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(budgetMax, row.id);
      for (const s of sellers) notify(db, s.id, 'budget-raised', { actorId: row.buyer_id, listingId: row.id });
      audit(db, req.user.id, 'listing.budget_raised', `listing:${row.id}`, { from: row.budget_max, to: budgetMax, told: sellers.length });
    });
    res.json({ listing: detailView(row.id, req.user), told: sellers.length });
  });

  r.post('/:id/status', requireAuth, (req, res) => {
    const row = ownListing(db, req);
    const status = v.oneOf(req.body, 'status', ['open', 'fulfilled', 'closed']);
    const conversationId = status === 'fulfilled' ? v.int(req.body, 'conversationId', { min: 1, optional: true }) : null;
    const conv = conversationId
      ? db.prepare('SELECT * FROM conversations WHERE id = ? AND listing_id = ?').get(conversationId, row.id)
      : null;
    if (conversationId && !conv) throw new HttpError(400, 'That conversation is not about this request.', { field: 'conversationId' });

    tx(db, () => {
      const deal = db.prepare('SELECT * FROM deals WHERE listing_id = ?').get(row.id);
      const keepsDeal = deal && conv && deal.conversation_id === conv.id;
      if (deal && !keepsDeal) {
        // Changing or undoing a deal is fine until someone has rated it.
        if (db.prepare('SELECT 1 FROM ratings WHERE deal_id = ?').get(deal.id)) {
          throw new HttpError(409, 'This deal has already been rated, so it can no longer be changed.');
        }
        db.prepare('DELETE FROM deals WHERE id = ?').run(deal.id);
        db.prepare(`DELETE FROM notifications WHERE kind = 'deal' AND conversation_id = ?`).run(deal.conversation_id);
      }
      if (conv && !keepsDeal) {
        const info = db.prepare('INSERT INTO deals (listing_id, conversation_id, buyer_id, vendor_id) VALUES (?, ?, ?, ?)')
          .run(row.id, conv.id, conv.buyer_id, conv.vendor_id);
        audit(db, req.user.id, 'deal.created', `deal:${info.lastInsertRowid}`, { listingId: row.id, vendorId: conv.vendor_id });
        notify(db, conv.vendor_id, 'deal', { actorId: req.user.id, listingId: row.id, conversationId: conv.id });
      }
      db.prepare(`UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, row.id);
      // Reopening starts a fresh 30 days (session 31).
      if (status === 'open') db.prepare(`UPDATE listings SET renewed_at = datetime('now'), expiry_reminded_at = NULL, expired_at = NULL WHERE id = ?`).run(row.id);
      // Only when it actually closes (not when a deal is changed later).
      if (row.status === 'open' && status !== 'open') thankOtherSellers(db, row, status);
      audit(db, req.user.id, `listing.${status}`, `listing:${row.id}`);
    });
    res.json({ listing: detailView(row.id, req.user) });
  });

  return r;
}

function ownListing(db, req) {
  const row = db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.params.id));
  if (!row) throw notFound('Request not found.');
  if (row.buyer_id !== req.user.id) throw new HttpError(403, 'Only the person who posted this request can change it.');
  return row;
}

function readListingBody(body) {
  const data = {
    title: v.str(body, 'title', { min: 5, max: 100 }),
    description: v.str(body, 'description', { min: 10, max: 3000 }),
    category: v.oneOf(body, 'category', CATEGORIES),
    budgetMin: v.int(body, 'budgetMin', { optional: true }),
    budgetMax: v.int(body, 'budgetMax', { optional: true }),
    currency: v.oneOf(body, 'currency', CURRENCIES, { optional: true }) || 'USD',
    city: normalizeCity(v.str(body, 'city', { min: 2, max: 80 })),
    neededBy: v.isoDate(body, 'neededBy', { optional: true }),
    contactRule: v.oneOf(body, 'contactRule', CONTACT_RULES, { optional: true }) || 'anyone',
  };
  if (data.budgetMin !== null && data.budgetMax !== null && data.budgetMin > data.budgetMax) {
    throw new HttpError(400, 'Minimum budget cannot be higher than maximum budget.', { field: 'budgetMin' });
  }
  return data;
}
