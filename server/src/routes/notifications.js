// The member's notifications (see lib/notify.js for what creates them).
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { avatarUrl } from '../lib/uploads.js';
import { nameFor } from '../../../shared/names.js';

export function notificationRoutes(db) {
  const r = Router();
  const unreadCount = db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL');

  r.get('/', requireAuth, (req, res) => {
    const rows = db.prepare(`
      SELECT n.*, a.display_name AS actor_name, a.short_name AS actor_short, a.avatar AS actor_avatar, l.title AS listing_title
      FROM notifications n
      LEFT JOIN users a ON a.id = n.actor_id
      LEFT JOIN listings l ON l.id = n.listing_id
      WHERE n.user_id = ?
      ORDER BY n.id DESC
      LIMIT 50
    `).all(req.user.id);
    res.json({
      notifications: rows.map((n) => ({
        id: n.id,
        kind: n.kind,
        actor: n.actor_id ? { id: n.actor_id, displayName: nameFor(n.actor_name, n.actor_short), avatarUrl: avatarUrl(n.actor_avatar) } : null,
        listing: n.listing_id ? { id: n.listing_id, title: n.listing_title } : null,
        conversationId: n.conversation_id,
        createdAt: n.created_at,
        read: n.read_at !== null,
      })),
      unread: unreadCount.get(req.user.id).n,
    });
  });

  r.get('/unread-count', requireAuth, (req, res) => {
    res.json({ unread: unreadCount.get(req.user.id).n });
  });

  // Opening the notifications page marks them all as read.
  r.post('/read', requireAuth, (req, res) => {
    db.prepare(`UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL`).run(req.user.id);
    res.json({ unread: 0 });
  });

  return r;
}
