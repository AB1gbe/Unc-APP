// Verified shops (session 72): Unc puts businesses first. A public list of
// verified, non-banned business accounts for the front page and the Shops
// page. Like profiles, it has no way to message a shop: contact stays
// inside a request's chat.
//   GET /api/shops?q=&limit=  ->  { shops: [...] }
import { Router } from 'express';
import { avatarUrl } from '../lib/uploads.js';
import { shopFields } from '../middleware/auth.js';
import { ratingQueries } from '../lib/ratings.js';

export function shopRoutes(db) {
  const r = Router();
  const ratings = ratingQueries(db);
  r.get('/shops', (req, res) => {
    const q = String(req.query.q ?? '').trim().slice(0, 60);
    const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 60);
    const rows = db.prepare(`
      SELECT u.*, (SELECT COUNT(*) FROM deals d WHERE d.vendor_id = u.id) AS sales
      FROM users u
      WHERE u.account_type = 'business' AND u.kyc_status = 'approved' AND u.banned_at IS NULL AND u.deleted_at IS NULL
        AND (? = '' OR u.display_name LIKE ? OR u.shop_area LIKE ? OR u.bio LIKE ?)
      ORDER BY sales DESC, u.created_at DESC, u.id DESC
      LIMIT ?
    `).all(q, `%${q}%`, `%${q}%`, `%${q}%`, limit);
    res.json({
      shops: rows.map((u) => ({
        id: u.id,
        displayName: u.display_name, // shops always show their full business name
        avatarUrl: avatarUrl(u.avatar),
        bio: u.bio,
        city: u.city,
        sales: u.sales,
        rating: ratings.summaryFor(u.id),
        ...shopFields(u),
      })),
    });
  });
  return r;
}
