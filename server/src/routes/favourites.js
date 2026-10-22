// Favourite sellers (session 28): a member ♥s a verified seller. When the
// member later posts a request in a category that seller deals in, the
// seller hears about it first (🔔 + phone push). They still answer through
// the request itself, like everyone else: this is not a way to message.
import { Router } from 'express';
import { HttpError, notFound } from '../lib/http.js';
import { avatarUrl } from '../lib/uploads.js';
import { notify } from '../lib/notify.js';
import { pushTo } from '../lib/push.js';
import { parseInterests, requireAuth } from '../middleware/auth.js';

export function favouriteRoutes(db) {
  const r = Router();
  const seller = db.prepare(`SELECT * FROM users WHERE id = ? AND kyc_status = 'approved' AND banned_at IS NULL`);

  r.put('/members/:id/favourite', requireAuth, (req, res) => {
    const s = seller.get(Number(req.params.id));
    if (!s) throw notFound('Member not found.');
    if (s.id === req.user.id) throw new HttpError(400, "You can't favourite yourself.");
    db.prepare('INSERT OR IGNORE INTO favourites (user_id, seller_id) VALUES (?, ?)').run(req.user.id, s.id);
    res.json({ favourite: true });
  });

  r.delete('/members/:id/favourite', requireAuth, (req, res) => {
    db.prepare('DELETE FROM favourites WHERE user_id = ? AND seller_id = ?').run(req.user.id, Number(req.params.id));
    res.json({ favourite: false });
  });

  // My favourite sellers, newest first.
  r.get('/favourites', requireAuth, (req, res) => {
    const rows = db.prepare(`
      SELECT u.id, u.display_name, u.avatar, u.account_type, u.city, u.shop_area
      FROM favourites f JOIN users u ON u.id = f.seller_id
      WHERE f.user_id = ? AND u.banned_at IS NULL
      ORDER BY f.created_at DESC, u.id DESC LIMIT 100
    `).all(req.user.id);
    res.json({
      sellers: rows.map((u) => ({
        id: u.id, displayName: u.display_name, avatarUrl: avatarUrl(u.avatar),
        accountType: u.account_type, city: u.shop_area || u.city,
      })),
    });
  });

  return r;
}

// Called after a request is created: tell the buyer's favourite sellers
// whose interests include the category (or who chose no interests).
export function tellFavourites(db, buyer, listing) {
  const told = new Set();
  const sellers = db.prepare(`
    SELECT u.id, u.interests FROM favourites f JOIN users u ON u.id = f.seller_id
    WHERE f.user_id = ? AND u.kyc_status = 'approved' AND u.banned_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.user_id = f.user_id AND b.blocked_id = u.id) OR (b.user_id = u.id AND b.blocked_id = f.user_id))
  `).all(buyer.id);
  for (const s of sellers) {
    const interests = parseInterests(s.interests);
    if (interests.length && !interests.includes(listing.category)) continue;
    told.add(s.id);
    notify(db, s.id, 'favourite-request', { actorId: buyer.id, listingId: listing.id });
    pushTo(db, s.id, 'favourite-request', { actor: buyer.display_name, title: listing.title }, `/requests/${listing.id}`)
      .catch((err) => console.warn('[push]', err.message));
  }
  return told;
}
