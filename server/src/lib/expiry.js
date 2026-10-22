// "Still looking?" (session 31): open requests close by themselves after
// LIFE_DAYS, so Browse stays fresh. REMIND_DAYS before that, the buyer gets
// a 🔔 + push with a one-tap "Keep it open" (POST /api/listings/:id/renew),
// which starts the 30 days again. Runs hourly (server/src/index.js).
import { notify } from './notify.js';
import { pushTo } from './push.js';

export const LIFE_DAYS = 30;
export const REMIND_DAYS = 3;

// When a request's 30 days started: last renewal (or reopening), else posting.
const START = 'COALESCE(renewed_at, created_at)';
export const EXPIRES_AT_SQL = `datetime(${START}, '+${LIFE_DAYS} days')`;

export function runExpiry(db) {
  const remind = db.prepare(`
    SELECT id, buyer_id, title FROM listings
    WHERE status = 'open' AND expiry_reminded_at IS NULL AND ${START} <= datetime('now', '-${LIFE_DAYS - REMIND_DAYS} days')
      AND ${START} > datetime('now', '-${LIFE_DAYS} days')
  `).all();
  for (const l of remind) {
    db.prepare(`UPDATE listings SET expiry_reminded_at = datetime('now') WHERE id = ?`).run(l.id);
    notify(db, l.buyer_id, 'expiring', { listingId: l.id });
    pushTo(db, l.buyer_id, 'expiring', { title: l.title }, `/requests/${l.id}`).catch((err) => console.warn('[push]', err.message));
  }
  const expire = db.prepare(`SELECT id, buyer_id FROM listings WHERE status = 'open' AND ${START} <= datetime('now', '-${LIFE_DAYS} days')`).all();
  for (const l of expire) {
    db.prepare(`UPDATE listings SET status = 'closed', expired_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(l.id);
    notify(db, l.buyer_id, 'expired', { listingId: l.id });
  }
  return { reminded: remind.length, expired: expire.length };
}
