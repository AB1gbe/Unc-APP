// "What people are asking for" (session 34): for sellers, counts of open
// requests from the last 30 days per category, how many still have no
// offer, and the words buyers often use. Counts only: no names, no single
// request's words (a word must appear in at least 2 requests).
import { Router } from 'express';
import { requireVerified } from '../middleware/auth.js';
import { GOVERNORATES, areasOf } from '../../../shared/areas.js';

export const DEMAND_DAYS = 30;
const MIN_REQUESTS = 2;   // a category shows only with at least this many
const MAX_ROWS = 5000;    // newest open requests looked at (keeps it quick)

// Words that say nothing about the item.
const STOP = new Set(`looking for need needed want wanted with and the any used new good some please someone who can
  have get buy from that this one two very like near size work works working condition original cheap best
  ابحث أبحث عن مطلوب احتاج أحتاج اريد أريد في من مع على او أو الى إلى جديد مستعمل حالة جيدة لو سمحت`.split(/\s+/));

export function topWords(titles, limit = 3) {
  const counts = new Map();
  for (const title of titles) {
    const words = new Set((title.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
      .filter((w) => [...w].length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)));
    for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts].filter(([, n]) => n >= MIN_REQUESTS)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([w]) => w);
}

export function demandRoutes(db) {
  const r = Router();

  r.get('/', requireVerified, (req, res) => {
    const where = [`l.status = 'open'`, `l.created_at >= datetime('now', '-${DEMAND_DAYS} days')`, 'u.banned_at IS NULL'];
    const params = [];
    // ?area=Capital (a governorate key) narrows it to that governorate.
    const gov = GOVERNORATES.some((g) => g.key === req.query.area) ? req.query.area : null;
    if (gov) {
      const areas = areasOf(gov);
      where.push(`l.city IN (${areas.map(() => '?').join(', ')})`);
      params.push(...areas);
    }
    const rows = db.prepare(`
      SELECT l.category, l.title, EXISTS (SELECT 1 FROM conversations c WHERE c.listing_id = l.id) AS answered
      FROM listings l JOIN users u ON u.id = l.buyer_id
      WHERE ${where.join(' AND ')}
      ORDER BY l.created_at DESC LIMIT ${MAX_ROWS}
    `).all(...params);
    const groups = new Map();
    for (const row of rows) {
      const g = groups.get(row.category) || { category: row.category, requests: 0, waiting: 0, titles: [] };
      g.requests += 1;
      if (!row.answered) { g.waiting += 1; g.titles.push(row.title); }
      groups.set(row.category, g);
    }
    const categories = [...groups.values()].filter((g) => g.requests >= MIN_REQUESTS)
      .map(({ titles, ...g }) => ({ ...g, words: topWords(titles) }))
      .sort((a, b) => b.waiting - a.waiting || b.requests - a.requests || a.category.localeCompare(b.category));
    res.json({ days: DEMAND_DAYS, area: gov, categories });
  });

  return r;
}
