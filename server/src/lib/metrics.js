// The owner dashboard (session 37): is the marketplace working? Worked out
// from the tables we already have, for the last N days. Admins only.
import { governorateOf } from '../../../shared/areas.js';

export const METRIC_DAYS = [7, 30, 90];

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const hoursBetween = (a, b) => (Date.parse(`${b.replace(' ', 'T')}Z`) - Date.parse(`${a.replace(' ', 'T')}Z`)) / 3_600_000;

export function metrics(db, days = 30) {
  const since = `datetime('now', '-${days} days')`;
  // One row per day, oldest first, with zeros for quiet days.
  const perDay = (sql) => new Map(db.prepare(sql).all().map((r) => [r.day, r.n]));
  const requests = perDay(`SELECT date(created_at) AS day, COUNT(*) AS n FROM listings WHERE created_at >= ${since} GROUP BY day`);
  const offers = perDay(`SELECT date(created_at) AS day, COUNT(*) AS n FROM conversations WHERE created_at >= ${since} GROUP BY day`);
  const deals = perDay(`SELECT date(created_at) AS day, COUNT(*) AS n FROM deals WHERE created_at >= ${since} GROUP BY day`);
  const members = perDay(`SELECT date(created_at) AS day, COUNT(*) AS n FROM users WHERE role = 'user' AND deleted_at IS NULL AND created_at >= ${since} GROUP BY day`);
  const daily = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    daily.push({ day, requests: requests.get(day) || 0, offers: offers.get(day) || 0, deals: deals.get(day) || 0, members: members.get(day) || 0 });
  }
  const sum = (k) => daily.reduce((n, d) => n + d[k], 0);

  // Requests at least a day old: did they get an offer, and how fast?
  const rows = db.prepare(`
    SELECT l.created_at, l.category, l.city, (SELECT MIN(c.created_at) FROM conversations c WHERE c.listing_id = l.id) AS first_offer
    FROM listings l WHERE l.created_at >= ${since}
  `).all();
  const dayOld = rows.filter((r) => hoursBetween(r.created_at, new Date().toISOString().slice(0, 19).replace('T', ' ')) >= 24);
  const answered = dayOld.filter((r) => r.first_offer);
  const firstOfferHours = median(rows.filter((r) => r.first_offer).map((r) => hoursBetween(r.created_at, r.first_offer)));

  const count = (list, key) => {
    const m = new Map();
    for (const r of list) { const k = key(r); m.set(k, (m.get(k) || 0) + 1); }
    return [...m].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n || String(a.name).localeCompare(String(b.name)));
  };
  return {
    days,
    totals: { requests: sum('requests'), offers: sum('offers'), deals: sum('deals'), members: sum('members') },
    answeredShare: dayOld.length ? Math.round((answered.length / dayOld.length) * 100) : null,
    firstOfferHours: firstOfferHours == null ? null : Math.round(firstOfferHours * 10) / 10,
    daily,
    categories: count(rows, (r) => r.category).slice(0, 6),
    areas: count(rows, (r) => governorateOf(r.city) || 'Other'),
  };
}
