// Block / unblock a member, and my block list (session 31).
import { Router } from 'express';
import { HttpError, notFound } from '../lib/http.js';
import { avatarUrl } from '../lib/uploads.js';
import { audit } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { nameFor } from '../../../shared/names.js';

export function blockRoutes(db) {
  const r = Router();

  r.post('/members/:id/block', requireAuth, (req, res) => {
    const other = db.prepare('SELECT id FROM users WHERE id = ?').get(Number(req.params.id));
    if (!other) throw notFound('Member not found.');
    if (other.id === req.user.id) throw new HttpError(400, "You can't block yourself.");
    db.prepare('INSERT OR IGNORE INTO blocks (user_id, blocked_id) VALUES (?, ?)').run(req.user.id, other.id);
    // A blocked member is no longer a favourite either.
    db.prepare('DELETE FROM favourites WHERE user_id = ? AND seller_id = ?').run(req.user.id, other.id);
    audit(db, req.user.id, 'member.blocked', `user:${other.id}`);
    res.json({ blocked: true });
  });

  r.delete('/members/:id/block', requireAuth, (req, res) => {
    db.prepare('DELETE FROM blocks WHERE user_id = ? AND blocked_id = ?').run(req.user.id, Number(req.params.id));
    res.json({ blocked: false });
  });

  r.get('/blocks', requireAuth, (req, res) => {
    const rows = db.prepare(`
      SELECT u.id, u.display_name, u.short_name, u.avatar FROM blocks b JOIN users u ON u.id = b.blocked_id
      WHERE b.user_id = ? ORDER BY b.created_at DESC
    `).all(req.user.id);
    res.json({ members: rows.map((u) => ({ id: u.id, displayName: nameFor(u.display_name, u.short_name), avatarUrl: avatarUrl(u.avatar) })) });
  });

  return r;
}
