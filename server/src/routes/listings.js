// "Listings" are REQUESTS posted by buyers: "I want X". Vendors browse them
// and reach out about a specific one (see conversations.js).
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { audit, tx } from '../db.js';
import { HttpError, notFound } from '../lib/http.js';
import { LISTING_DIR, avatarUrl, memoryUpload, saveFiles } from '../lib/uploads.js';
import { CATEGORIES, CURRENCIES, JOB_TYPES, SECTIONS, categoriesFor } from '../lib/categories.js';
import { checkAd } from '../../../shared/scam-check.js';
import { payForAd, settleAd } from '../lib/billing.js';
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
import { EXPIRES_AT_SQL, LIFE_DAYS } from '../lib/expiry.js';
import { CONTACT_ALLOWED_SQL, CONTACT_RULES, contactAllowedParams, contactBlocker } from '../lib/contact.js';
import { NOT_AWAY } from '../lib/activity.js';
import { nameFor } from '../../../shared/names.js';

export const MAX_PHOTOS = 6;
export const CONDITIONS = ['any', 'new', 'used'];
export const SORTS = ['newest', 'closing', 'offers'];
// Housing and Jobs ads (session 82): how many a member may post a day, and
// how long the same title can't be posted again (Craigslist's repeat-post rule).
export const ADS_PER_DAY = 5;
export const REPEAT_DAYS = 7;

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
    condition: row.item_condition ?? 'any',
    // Craigslist-style sections (session 82).
    section: row.section ?? 'wanted',
    bedrooms: row.bedrooms ?? null,
    furnished: row.furnished == null ? null : row.furnished === 1,
    jobType: row.job_type ?? null,
    // Held for a scam check: only the poster (and admins) can see it.
    held: Boolean(row.held_at),
    // Demo data from `npm run seed` (session 77): shown as "Sample", never as live.
    sample: row.sample === 1,
    buyer: { id: row.buyer_id, displayName: nameFor(row.buyer_name, row.buyer_short), accountType: row.buyer_type, avatarUrl: avatarUrl(row.buyer_avatar) },
    images: images.map((i) => `/uploads/listings/${i.file}`),
    photos: images.map((i) => ({ id: i.id, url: `/uploads/listings/${i.file}` })),
    offerCount: row.offer_count ?? undefined,
    // When an open request closes by itself (session 56: "Closes in 2 days" on cards).
    closesAt: row.status === 'open' && row.closes_at ? row.closes_at : undefined,
  };
}

const BASE_SELECT = `
  SELECT l.*, u.display_name AS buyer_name, u.account_type AS buyer_type, u.avatar AS buyer_avatar, u.short_name AS buyer_short, u.banned_at IS NOT NULL AS buyer_banned,
         (SELECT COUNT(*) FROM conversations c WHERE c.listing_id = l.id) AS offer_count,
         datetime(COALESCE(l.renewed_at, l.created_at), '+${LIFE_DAYS} days') AS closes_at
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
  // Who answered a request (session 77, the owner's choice): verified shops
  // and finders with their rating and area, but NEVER their prices, which
  // stay private to the buyer. Newest first.
  const respondersStmt = db.prepare(`
    SELECT u.id, u.display_name, u.short_name, u.account_type, u.avatar, COALESCE(u.shop_area, u.city) AS area, c.created_at
    FROM conversations c JOIN users u ON u.id = c.vendor_id
    WHERE c.listing_id = ? AND u.banned_at IS NULL
    ORDER BY c.created_at DESC, c.id DESC LIMIT ?
  `);
  const respondersOf = (listingId, limit = 20, withReplyTime = false) => respondersStmt.all(listingId, limit).map((u) => ({
    id: u.id,
    displayName: u.account_type === 'business' ? u.display_name : nameFor(u.display_name, u.short_name),
    accountType: u.account_type,
    avatarUrl: avatarUrl(u.avatar),
    area: u.area,
    rating: ratings.summaryFor(u.id),
    replyTime: withReplyTime ? activity.replyTime(u.id) : undefined,
    answeredAt: u.created_at,
  }));

  // The full single-request view: adds the buyer's rating and, for the
  // owner, which conversation the deal was made in.
  function detailView(id, me) {
    const listing = withImages(db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(id));
    listing.buyer.rating = ratings.summaryFor(listing.buyer.id);
    listing.buyer.badges = badgesFor(listing.buyer.id);
    if (me) listing.buyer.activity = activity.summaryFor(listing.buyer.id);
    // Who answered is public only for requests: who applied for a job or
    // asked about a flat stays private to the advertiser (session 82).
    listing.responders = listing.section === 'wanted' ? respondersOf(id, 20, true) : [];
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
    // One section at a time; requests ("wanted") unless another is asked for.
    const section = SECTIONS.includes(req.query.section) ? req.query.section : 'wanted';
    const where = [`l.status = 'open'`, 'u.banned_at IS NULL', 'l.section = ?', 'l.held_at IS NULL'];
    const params = [section];
    if (req.user) { where.push(NOT_BLOCKED_BUYER); params.push(req.user.id); }
    if (req.query.q) {
      // Words match the item, the description or the area (session 77).
      where.push('(l.title LIKE ? OR l.description LIKE ? OR l.city LIKE ?)');
      const like = `%${String(req.query.q).slice(0, 100)}%`;
      params.push(like, like, like);
    }
    // Budget: requests whose range overlaps the one asked for (session 77).
    const min = Number.parseInt(req.query.min, 10);
    const max = Number.parseInt(req.query.max, 10);
    if (Number.isFinite(min) && min >= 0) { where.push('COALESCE(l.budget_max, l.budget_min, 0) >= ?'); params.push(min); }
    if (Number.isFinite(max) && max >= 0) { where.push('COALESCE(l.budget_min, l.budget_max, 0) <= ?'); params.push(max); }
    if (req.query.offers === 'with') where.push('EXISTS (SELECT 1 FROM conversations c WHERE c.listing_id = l.id)');
    if (req.query.offers === 'none') where.push('NOT EXISTS (SELECT 1 FROM conversations c WHERE c.listing_id = l.id)');
    if (CONDITIONS.includes(req.query.condition) && req.query.condition !== 'any') {
      where.push(`l.item_condition IN (?, 'any')`); params.push(req.query.condition);
    }
    if (section === 'housing') {
      const beds = Number.parseInt(req.query.bedrooms, 10);
      if (Number.isFinite(beds) && beds > 0) { where.push('l.bedrooms >= ?'); params.push(beds); }
      if (req.query.furnished === 'yes' || req.query.furnished === 'no') { where.push('l.furnished = ?'); params.push(req.query.furnished === 'yes' ? 1 : 0); }
    }
    if (section === 'jobs' && JOB_TYPES.includes(req.query.jobType)) { where.push('l.job_type = ?'); params.push(req.query.jobType); }
    if (req.query.category && categoriesFor(section).includes(req.query.category)) {
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
    const order = {
      newest: 'l.created_at DESC, l.id DESC',
      closing: 'COALESCE(l.renewed_at, l.created_at) ASC, l.id ASC',
      offers: 'offer_count DESC, l.created_at DESC, l.id DESC',
    }[SORTS.includes(req.query.sort) ? req.query.sort : 'newest'];
    const rows = db.prepare(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`)
      .all(...params, pageSize + 1, (page - 1) * pageSize);
    res.json({
      listings: rows.slice(0, pageSize).map((row) => ({ ...withImages(row), responders: section === 'wanted' ? respondersOf(row.id, 3) : undefined })),
      page,
      hasMore: rows.length > pageSize,
    });
  });

  // The Craigslist-style front page (session 82): how many open ads each
  // section and category has, and the newest few in each section.
  r.get('/sections', (req, res) => {
    const counts = db.prepare(`
      SELECT l.section, l.category, COUNT(*) AS n FROM listings l JOIN users u ON u.id = l.buyer_id
      WHERE l.status = 'open' AND l.held_at IS NULL AND u.banned_at IS NULL GROUP BY l.section, l.category
    `).all();
    const latest = {};
    for (const section of SECTIONS) {
      latest[section] = db.prepare(`${BASE_SELECT} WHERE l.status = 'open' AND l.section = ? AND l.held_at IS NULL AND u.banned_at IS NULL ORDER BY l.created_at DESC, l.id DESC LIMIT 12`)
        .all(section).map(withImages);
    }
    const out = Object.fromEntries(SECTIONS.map((sec) => [sec, { total: 0, categories: {} }]));
    for (const c of counts) { out[c.section].total += c.n; out[c.section].categories[c.category] = c.n; }
    res.json({ sections: out, latest });
  });

  // "Requests you could help with" on the member's home page: open
  // requests in their interests (all categories if they chose none), not
  // their own, not ones they already answered; same city first, newest first.
  r.get('/for-you', requireAuth, (req, res) => {
    const interests = parseInterests(req.user.interests).filter((c) => CATEGORIES.includes(c));
    const rows = db.prepare(`
      ${BASE_SELECT}
      WHERE l.status = 'open' AND u.banned_at IS NULL AND l.buyer_id <> ? AND ${NOT_BLOCKED_BUYER}
        AND l.section = 'wanted' AND l.held_at IS NULL AND ${CONTACT_ALLOWED_SQL}
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
      || (row.status !== 'open' && !isOwner && !isParticipant && !isAdmin)  // closed: owner, its vendors, admins
      || (row.held_at && !isOwner && !isAdmin);                          // held for a scam check (session 82)
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
      // Where my offer stands (session 77): sent → seen → accepted / declined.
      if (conv) {
        const last = db.prepare('SELECT id, read_at FROM messages WHERE conversation_id = ? AND sender_id = ? AND offer_price IS NOT NULL ORDER BY id DESC LIMIT 1').get(conv.id, req.user.id);
        const answer = last && db.prepare(`SELECT kind FROM messages WHERE conversation_id = ? AND reply_to = ? AND kind IN ('accept', 'decline') ORDER BY id DESC LIMIT 1`).get(conv.id, last.id);
        listing.myOffer = !last ? { status: 'message' }
          : answer?.kind === 'accept' ? { status: 'accepted' }
          : answer?.kind === 'decline' ? { status: 'declined' }
          : { status: last.read_at ? 'seen' : 'sent', seenAt: last.read_at ?? null };
      }
      listing.saved = Boolean(db.prepare('SELECT 1 FROM saved_listings WHERE user_id = ? AND listing_id = ?').get(req.user.id, row.id));
      // Which rule stops me making an offer, if any (session 34).
      listing.contactBlocked = conv ? null : contactBlocker(db, row, req.user);
    }
    res.json({ listing });
  });

  r.post('/', requireVerified, upload.array('images', MAX_PHOTOS), async (req, res) => {
    const data = readListingBody(req.body);
    const held = adChecks(db, req.user.id, data);
    // Businesses pay for For sale, Housing and Jobs ads (session 88): from
    // their ad credit, or their card is charged now, before anything is
    // saved, so a declined card leaves no half-made ad.
    const payment = data.section === 'wanted' ? { from: 'free', price: 0 } : await payForAd(db, req.user, data.section);
    // All photos are checked before anything is saved, and the listing +
    // photo rows are written in one transaction: a bad photo means nothing
    // is created (no half-made listing that a retry would duplicate).
    const photos = saveFiles(LISTING_DIR(), (req.files || []).map((file) => ({ file })));
    let id;
    try {
      id = tx(db, () => {
        const info = db.prepare(`
          INSERT INTO listings (buyer_id, title, description, category, budget_min, budget_max, currency, city, needed_by, contact_rule, item_condition,
            section, bedrooms, furnished, job_type, held_at, held_reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${held.length ? "datetime('now')" : 'NULL'}, ?)
        `).run(req.user.id, data.title, data.description, data.category, data.budgetMin, data.budgetMax,
          data.currency, data.city, data.neededBy, data.contactRule, data.condition,
          data.section, data.bedrooms, data.furnished, data.jobType, held.length ? held.join('; ') : null);
        const newId = Number(info.lastInsertRowid);
        for (const name of photos.names) {
          db.prepare('INSERT INTO listing_images (listing_id, file) VALUES (?, ?)').run(newId, name);
        }
        if (req.actorId) db.prepare('UPDATE listings SET posted_by = ? WHERE id = ?').run(req.actorId, newId);
        settleAd(db, req.user, req.actorId, newId, payment);
        audit(db, req.actorId ?? req.user.id, 'listing.created', `listing:${newId}`, req.actorId ? { for: req.user.id } : undefined);
        return newId;
      });
    } catch (err) {
      photos.discard();
      throw err;
    }
    // Ads (Housing, Jobs) and held posts don't go out as request alerts.
    if (data.section !== 'wanted' || held.length) {
      return res.status(201).json({ listing: withImages(db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(id)), held, paid: { amount: payment.price, from: payment.from } });
    }
    // Sellers who were favourited by this buyer hear about it first.
    // Then everyone whose request alert matches (session 31), once each.
    const told = tellFavourites(db, req.user, { id, title: data.title, category: data.category, contact_rule: data.contactRule, buyer_id: req.user.id });
    tellAlerts(db, req.user, {
      id, title: data.title, description: data.description, category: data.category, city: data.city,
      budget_min: data.budgetMin, budget_max: data.budgetMax, contact_rule: data.contactRule, buyer_id: req.user.id,
    }, told);
    res.status(201).json({ listing: withImages(db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(id)), paid: { amount: payment.price, from: payment.from } });
  });

  r.patch('/:id', requireVerified, (req, res) => {
    const row = ownListing(db, req);
    if (row.status !== 'open') throw new HttpError(409, 'Only open requests can be edited.');
    // The section can't change after posting (session 82).
    const data = readListingBody({ ...req.body, section: row.section });
    const held = adChecks(db, req.user.id, data, row);
    db.prepare(`
      UPDATE listings SET title = ?, description = ?, category = ?, budget_min = ?, budget_max = ?, currency = ?,
        city = ?, needed_by = ?, contact_rule = ?, item_condition = ?, bedrooms = ?, furnished = ?, job_type = ?, updated_at = datetime('now') WHERE id = ?
    `).run(data.title, data.description, data.category, data.budgetMin, data.budgetMax, data.currency,
      data.city, data.neededBy, data.contactRule, data.condition, data.bedrooms, data.furnished, data.jobType, row.id);
    if (held.length && !row.held_at) db.prepare(`UPDATE listings SET held_at = datetime('now'), held_reason = ? WHERE id = ?`).run(held.join('; '), row.id);
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
  const section = v.oneOf(body, 'section', SECTIONS, { optional: true }) || 'wanted';
  const data = {
    section,
    title: v.str(body, 'title', { min: 5, max: 100 }),
    description: v.str(body, 'description', { min: 10, max: 3000 }),
    category: v.oneOf(body, 'category', categoriesFor(section)),
    budgetMin: v.int(body, 'budgetMin', { optional: true }),
    budgetMax: v.int(body, 'budgetMax', { optional: true }),
    currency: v.oneOf(body, 'currency', CURRENCIES, { optional: true }) || 'BHD',
    city: normalizeCity(v.str(body, 'city', { min: 2, max: 80 })),
    neededBy: v.isoDate(body, 'neededBy', { optional: true }),
    contactRule: v.oneOf(body, 'contactRule', CONTACT_RULES, { optional: true }) || 'anyone',
    condition: v.oneOf(body, 'condition', CONDITIONS, { optional: true }) || 'any',
  };
  if (data.budgetMin !== null && data.budgetMax !== null && data.budgetMin > data.budgetMax) {
    throw new HttpError(400, 'Minimum budget cannot be higher than maximum budget.', { field: 'budgetMin' });
  }
  // Housing: a monthly rent (kept in budget_min and budget_max), bedrooms
  // and furnished. Jobs: a job type and an optional monthly pay range.
  data.bedrooms = null; data.furnished = null; data.jobType = null;
  if (section === 'housing') {
    data.budgetMin = v.int(body, 'rent', { min: 1, max: 100_000 });
    data.budgetMax = data.budgetMin;
    data.bedrooms = v.int(body, 'bedrooms', { min: 0, max: 20, optional: true });
    const f = body?.furnished;
    data.furnished = f === undefined || f === null || f === '' ? null : (f === true || f === 'true' || f === '1' || f === 1 ? 1 : 0);
  }
  if (section === 'jobs') data.jobType = v.oneOf(body, 'jobType', JOB_TYPES);
  // For sale (session 84): one asking price, and new or used.
  if (section === 'forsale') {
    data.budgetMin = v.int(body, 'price', { min: 1, max: 10_000_000 });
    data.budgetMax = data.budgetMin;
    data.condition = v.oneOf(body, 'condition', ['new', 'used']);
  }
  if (section !== 'wanted') { if (section !== 'forsale') data.condition = 'any'; data.neededBy = null; data.contactRule = 'anyone'; }
  return data;
}

// Safety checks for Housing and Jobs ads (session 82): refuses scam
// wording, contact details, the same ad twice in a week and more than
// ADS_PER_DAY ads a day; returns the reasons an ad is held for a check.
// An ad the Unc team already approved (checked_at) isn't held again.
function adChecks(db, userId, data, existing = null) {
  if (data.section === 'wanted') return [];
  const { block, hold } = checkAd({ ...data, price: data.budgetMin, priceMax: data.budgetMax });
  if (block) throw new HttpError(400, block, { field: 'description', scam: true });
  const repeat = db.prepare(`
    SELECT 1 FROM listings WHERE buyer_id = ? AND section = ? AND lower(title) = lower(?) AND id <> ?
      AND created_at >= datetime('now', '-${REPEAT_DAYS} days') AND status = 'open'
  `).get(userId, data.section, data.title, existing?.id ?? 0);
  if (repeat) throw new HttpError(409, 'You already have an open ad with this title. Edit that one instead of posting it again.', { field: 'title' });
  if (!existing) {
    const today = db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE buyer_id = ? AND section <> 'wanted' AND created_at >= datetime('now', '-1 day')`).get(userId).n;
    if (today >= ADS_PER_DAY) throw new HttpError(429, 'You can post up to 5 ads a day. Please try again tomorrow.');
  }
  return existing?.checked_at ? [] : hold;
}
