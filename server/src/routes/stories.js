// "Found it" stories (session 20): after a deal, the buyer or the seller
// can share a sentence and a photo. They are public (Home, profiles), so
// they are opt-in, short, and an admin can hide one.
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { audit } from '../db.js';
import { HttpError, notFound } from '../lib/http.js';
import { STORY_DIR, avatarUrl, memoryUpload, saveFiles } from '../lib/uploads.js';
import * as v from '../lib/validate.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const STORY_SELECT = `
  SELECT s.*, a.display_name AS author_name, a.avatar AS author_avatar,
         CASE WHEN a.id = d.buyer_id THEN d.vendor_id ELSE d.buyer_id END AS other_id,
         o.display_name AS other_name, l.title AS listing_title
  FROM stories s
  JOIN deals d ON d.id = s.deal_id
  JOIN users a ON a.id = s.author_id
  JOIN users o ON o.id = CASE WHEN a.id = d.buyer_id THEN d.vendor_id ELSE d.buyer_id END
  JOIN listings l ON l.id = d.listing_id
  WHERE s.hidden_at IS NULL AND a.banned_at IS NULL AND o.banned_at IS NULL
`;

export const storyView = (s) => ({
  id: s.id,
  body: s.body,
  imageUrl: s.image ? `/uploads/stories/${s.image}` : null,
  createdAt: s.created_at,
  author: { id: s.author_id, displayName: s.author_name, avatarUrl: avatarUrl(s.author_avatar) },
  other: { id: s.other_id, displayName: s.other_name },
  listingTitle: s.listing_title,
});

export function storiesAbout(db, userId, limit = 6) {
  return db.prepare(`${STORY_SELECT} AND (d.buyer_id = ? OR d.vendor_id = ?) ORDER BY s.id DESC LIMIT ?`).all(userId, userId, limit).map(storyView);
}

export function storyRoutes(db) {
  const r = Router();
  const upload = memoryUpload(1);

  // Newest stories for Home and the landing page.
  r.get('/stories', (_req, res) => {
    res.json({ stories: db.prepare(`${STORY_SELECT} ORDER BY s.id DESC LIMIT 12`).all().map(storyView) });
  });

  r.post('/deals/:id/story', requireAuth, upload.single('image'), (req, res) => {
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(Number(req.params.id));
    if (!deal || (deal.buyer_id !== req.user.id && deal.vendor_id !== req.user.id)) throw notFound('Deal not found.');
    if (db.prepare('SELECT 1 FROM stories WHERE deal_id = ? AND author_id = ?').get(deal.id, req.user.id)) {
      throw new HttpError(409, 'You already shared a story about this deal.');
    }
    const body = v.str(req.body, 'story', { min: 5, max: 280 });
    const photo = req.file ? saveFiles(STORY_DIR(), [{ file: req.file }]) : null;
    try {
      db.prepare('INSERT INTO stories (deal_id, author_id, body, image) VALUES (?, ?, ?, ?)').run(deal.id, req.user.id, body, photo?.names[0] ?? null);
    } catch (err) {
      photo?.discard();
      throw err;
    }
    res.status(201).json({ ok: true });
  });

  // The author can take their story down at any time (photo deleted too).
  r.delete('/stories/:id', requireAuth, (req, res) => {
    const s = db.prepare('SELECT * FROM stories WHERE id = ? AND author_id = ?').get(Number(req.params.id), req.user.id);
    if (!s) throw notFound('Story not found.');
    db.prepare('DELETE FROM stories WHERE id = ?').run(s.id);
    if (s.image) fs.rmSync(path.join(STORY_DIR(), s.image), { force: true });
    res.json({ ok: true });
  });

  r.post('/admin/stories/:id/hide', requireAdmin, (req, res) => {
    const s = db.prepare('SELECT id FROM stories WHERE id = ?').get(Number(req.params.id));
    if (!s) throw notFound('Story not found.');
    db.prepare(`UPDATE stories SET hidden_at = datetime('now') WHERE id = ?`).run(s.id);
    audit(db, req.user.id, 'story.hidden', `story:${s.id}`);
    res.json({ ok: true });
  });

  return r;
}
