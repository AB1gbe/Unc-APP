// "Happening near you" (session 26): recent real activity, the member's
// own city first. Private people are never named: a find shows only the
// city and category (the request itself is closed and no longer public).
// Shops are named, because a shop page is public by choice. The wording is
// written by the app from `kind`, so it shows in the reader's language.
import { Router } from 'express';

const DAYS = 7;          // how far back the feed looks
const LIMIT = 8;         // items shown
const BUSY_OFFERS = 2;   // "N offers in Riffa today" from this many

export function feedRoutes(db) {
  const r = Router();
  const found = db.prepare(`
    SELECT 'found' AS kind, d.created_at AS at, l.city, l.category
    FROM deals d JOIN listings l ON l.id = d.listing_id JOIN users b ON b.id = d.buyer_id JOIN users v ON v.id = d.vendor_id
    WHERE d.created_at >= datetime('now', '-${DAYS} days') AND b.banned_at IS NULL AND v.banned_at IS NULL
    ORDER BY d.created_at DESC LIMIT 20
  `);
  const requests = db.prepare(`
    SELECT 'request' AS kind, l.created_at AS at, l.city, l.category, l.id AS listing_id, l.title
    FROM listings l JOIN users u ON u.id = l.buyer_id
    WHERE l.status = 'open' AND l.created_at >= datetime('now', '-${DAYS} days') AND u.banned_at IS NULL
      AND l.buyer_id <> ? -- not the member's own requests
    ORDER BY l.created_at DESC LIMIT 20
  `);
  const shops = db.prepare(`
    SELECT 'shop' AS kind, u.created_at AS at, COALESCE(u.shop_area, u.city) AS city, u.id AS shop_id, u.display_name AS shop_name
    FROM users u
    WHERE u.account_type = 'business' AND u.created_at >= datetime('now', '-${DAYS} days')
      AND u.kyc_status = 'approved' AND u.banned_at IS NULL
    ORDER BY u.created_at DESC LIMIT 10
  `);
  const offersToday = db.prepare(`
    SELECT COUNT(*) AS n, MAX(c.created_at) AS at FROM conversations c JOIN listings l ON l.id = c.listing_id
    WHERE c.created_at >= datetime('now', '-1 day') AND lower(l.city) = lower(?)
  `);

  r.get('/', (req, res) => {
    const city = req.user?.city?.trim() || null;
    const near = (item) => Boolean(city && item.city && item.city.toLowerCase().includes(city.toLowerCase()));
    const items = [...found.all(), ...requests.all(req.user?.id ?? 0), ...shops.all()].map((i) => ({ ...i, near: near(i) }));
    if (city) {
      const busy = offersToday.get(city);
      if (busy.n >= BUSY_OFFERS) items.push({ kind: 'offers-today', at: busy.at, city, count: busy.n, near: true });
    }
    // Own city first, then newest first.
    items.sort((a, b) => (b.near - a.near) || (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
    res.json({
      city,
      items: items.slice(0, LIMIT).map((i) => ({
        kind: i.kind,
        at: i.at,
        city: i.city,
        near: i.near,
        category: i.category ?? undefined,
        listing: i.kind === 'request' ? { id: i.listing_id, title: i.title } : undefined,
        shop: i.kind === 'shop' ? { id: i.shop_id, displayName: i.shop_name } : undefined,
        count: i.count ?? undefined,
      })),
    });
  });
  return r;
}
