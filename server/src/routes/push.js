// Turning phone/computer notifications on and off (see lib/push.js).
import { Router } from 'express';
import { HttpError } from '../lib/http.js';
import { pushTo, vapidKeys } from '../lib/push.js';
import { requireAuth } from '../middleware/auth.js';

const MAX_DEVICES = 10;
const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;

function readSubscription(body) {
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  const { p256dh, auth } = body?.keys ?? {};
  let url;
  try { url = new URL(endpoint); } catch { /* checked below */ }
  if (!url || url.protocol !== 'https:' || endpoint.length > 1000) {
    throw new HttpError(400, 'This browser sent an invalid notification subscription.', { field: 'endpoint' });
  }
  for (const k of [p256dh, auth]) {
    if (typeof k !== 'string' || k.length > 200 || !B64URL.test(k)) {
      throw new HttpError(400, 'This browser sent an invalid notification subscription.', { field: 'keys' });
    }
  }
  return { endpoint, p256dh, auth };
}

export function pushRoutes(db) {
  const r = Router();

  // The public half of the server's key; the browser needs it to subscribe.
  r.get('/key', (_req, res) => {
    res.json({ publicKey: vapidKeys().publicKey });
  });

  // One row per device. A device that was used by another member before
  // (shared tablet) now belongs to whoever subscribed last.
  r.post('/subscribe', requireAuth, (req, res) => {
    const s = readSubscription(req.body);
    db.prepare(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth
    `).run(req.user.id, s.endpoint, s.p256dh, s.auth);
    db.prepare(`
      DELETE FROM push_subscriptions WHERE user_id = ? AND id NOT IN
        (SELECT id FROM push_subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT ${MAX_DEVICES})
    `).run(req.user.id, req.user.id);
    res.status(201).json({ ok: true });
  });

  r.post('/unsubscribe', requireAuth, (req, res) => {
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : '';
    db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').run(req.user.id, endpoint);
    res.json({ ok: true });
  });

  // "Send me a test" button: proves the whole chain works on this phone.
  r.post('/test', requireAuth, async (req, res) => {
    const sent = await pushTo(db, req.user.id, 'test', {}, '/account');
    if (!sent) throw new HttpError(409, 'Notifications are not turned on for any of your devices yet.');
    res.json({ sent });
  });

  return r;
}
