// "Listings" are REQUESTS posted by buyers: "I want X". Vendors browse them
// and reach out about a specific one (see conversations.js).
import { Router } from 'express';
import { audit } from '../db.js';
import { HttpError, notFound } from '../lib/http.js';
import { LISTING_DIR, memoryUpload, saveFile } from '../lib/uploads.js';
import { CATEGORIES, CURRENCIES } from '../lib/categories.js';
import * as v from '../lib/validate.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';

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
    buyer: { id: row.buyer_id, displayName: row.buyer_name, accountType: row.buyer_type },
    images: images.map((f) => `/uploads/listings/${f}`),
    offerCount: row.offer_count ?? undefined,
  };
}

const BASE_SELECT = `
  SELECT l.*, u.display_name AS buyer_name, u.account_type AS buyer_type,
         (SELECT COUNT(*) FROM conversations c WHERE c.listing_id = l.id) AS offer_count
  FROM listings l JOIN users u ON u.id = l.buyer_id
`;

export function listingRoutes(db) {
  const r = Router();
  const upload = memoryUpload(3);
  const imagesFor = db.prepare('SELECT file FROM listing_images WHERE listing_id = ? ORDER BY id');
  const withImages = (row) => listingView(row, imagesFor.all(row.id).map((i) => i.file));

  // Public browse + search. Only open requests are shown.
  r.get('/', (req, res) => {
    const where = [`l.status = 'open'`, 'u.banned_at IS NULL'];
    const params = [];
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
      where.push('l.city LIKE ?');
      params.push(`%${String(req.query.city).slice(0, 80)}%`);
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = 20;
    const rows = db.prepare(`${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY l.created_at DESC, l.id DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize + 1, (page - 1) * pageSize);
    res.json({
      listings: rows.slice(0, pageSize).map(withImages),
      page,
      hasMore: rows.length > pageSize,
    });
  });

  // The logged-in buyer's own requests, any status.
  r.get('/mine', requireAuth, (req, res) => {
    const rows = db.prepare(`${BASE_SELECT} WHERE l.buyer_id = ? ORDER BY l.created_at DESC, l.id DESC`).all(req.user.id);
    res.json({ listings: rows.map(withImages) });
  });

  r.get('/:id', (req, res) => {
    const row = db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(Number(req.params.id));
    // Closed/fulfilled requests stay visible to the owner but not the public.
    if (!row || (row.status !== 'open' && row.buyer_id !== req.user?.id && req.user?.role !== 'admin')) {
      throw notFound('This request does not exist or is no longer open.');
    }
    const listing = withImages(row);
    // Tell a vendor whether they've already reached out about this one.
    if (req.user && req.user.id !== row.buyer_id) {
      const conv = db.prepare('SELECT id FROM conversations WHERE listing_id = ? AND vendor_id = ?').get(row.id, req.user.id);
      listing.myConversationId = conv?.id ?? null;
    }
    res.json({ listing });
  });

  r.post('/', requireVerified, upload.array('images', 3), (req, res) => {
    const data = readListingBody(req.body);
    const info = db.prepare(`
      INSERT INTO listings (buyer_id, title, description, category, budget_min, budget_max, currency, city, needed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, data.title, data.description, data.category, data.budgetMin, data.budgetMax,
      data.currency, data.city, data.neededBy);
    const id = Number(info.lastInsertRowid);
    for (const file of req.files || []) {
      db.prepare('INSERT INTO listing_images (listing_id, file) VALUES (?, ?)').run(id, saveFile(file, LISTING_DIR()));
    }
    audit(db, req.user.id, 'listing.created', `listing:${id}`);
    res.status(201).json({ listing: withImages(db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(id)) });
  });

  r.patch('/:id', requireVerified, (req, res) => {
    const row = ownListing(db, req);
    if (row.status !== 'open') throw new HttpError(409, 'Only open requests can be edited.');
    const data = readListingBody(req.body);
    db.prepare(`
      UPDATE listings SET title = ?, description = ?, category = ?, budget_min = ?, budget_max = ?, currency = ?,
        city = ?, needed_by = ?, updated_at = datetime('now') WHERE id = ?
    `).run(data.title, data.description, data.category, data.budgetMin, data.budgetMax, data.currency,
      data.city, data.neededBy, row.id);
    res.json({ listing: withImages(db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(row.id)) });
  });

  // Mark as fulfilled / closed / reopen. Once not open, all its
  // conversations become read-only.
  r.post('/:id/status', requireAuth, (req, res) => {
    const row = ownListing(db, req);
    const status = v.oneOf(req.body, 'status', ['open', 'fulfilled', 'closed']);
    db.prepare(`UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, row.id);
    audit(db, req.user.id, `listing.${status}`, `listing:${row.id}`);
    res.json({ listing: withImages(db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(row.id)) });
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
    city: v.str(body, 'city', { min: 2, max: 80 }),
    neededBy: v.isoDate(body, 'neededBy', { optional: true }),
  };
  if (data.budgetMin !== null && data.budgetMax !== null && data.budgetMin > data.budgetMax) {
    throw new HttpError(400, 'Minimum budget cannot be higher than maximum budget.', { field: 'budgetMin' });
  }
  return data;
}
