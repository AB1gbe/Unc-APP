// Ratings rules in one place.
//
// * Only a DEAL can be rated: the buyer marked the request fulfilled and
//   picked the vendor they bought from. One rating per side per deal.
// * Ratings can be left for RATE_WINDOW_DAYS after the deal.
// * "Blind" ratings: a rating stays hidden until the other side has rated
//   too, or REVEAL_AFTER_DAYS have passed. Nobody can wait to see a bad
//   review and retaliate.
// See docs/Features/Ratings.md
export const RATE_WINDOW_DAYS = 30;
export const REVEAL_AFTER_DAYS = 14;

// SQL condition: is rating `r` (joined with its deal `d`) publicly visible?
export const VISIBLE = `(
  EXISTS (SELECT 1 FROM ratings o WHERE o.deal_id = r.deal_id AND o.rater_id <> r.rater_id)
  OR d.created_at <= datetime('now', '-${REVEAL_AFTER_DAYS} days')
)`;

export function ratingQueries(db) {
  const summary = db.prepare(`
    SELECT COUNT(*) AS count, ROUND(AVG(r.stars), 1) AS average
    FROM ratings r JOIN deals d ON d.id = r.deal_id
    WHERE r.ratee_id = ? AND ${VISIBLE}
  `);
  return {
    // { average: 4.5, count: 12 } - average is null when there are none yet
    summaryFor(userId) {
      const row = summary.get(userId);
      return { average: row.count ? row.average : null, count: row.count };
    },
  };
}

export function canStillRate(dealCreatedAt) {
  const deadline = new Date(dealCreatedAt.replace(' ', 'T') + 'Z');
  deadline.setUTCDate(deadline.getUTCDate() + RATE_WINDOW_DAYS);
  return Date.now() < deadline.getTime();
}
