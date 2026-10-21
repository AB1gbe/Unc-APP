// "Active now", "Usually replies within an hour" (session 20). Shown only
// to logged-in members, so a person isn't watched by strangers.
// Reply time = the median of how long the member took to answer the other
// side's first message, over their 50 newest conversations; at least 3
// conversations are needed, so one slow day doesn't label anyone.

export const ACTIVE_MINUTES = 5; // "Active now" if seen this recently

export function activityQueries(db) {
  const seen = db.prepare('SELECT last_seen_at, hide_activity FROM users WHERE id = ?');
  // UNION ALL keeps both halves on their indexes (see performance.test.js).
  const replies = db.prepare(`
    WITH mine AS (
      SELECT id FROM (SELECT id FROM conversations WHERE buyer_id = ? UNION ALL SELECT id FROM conversations WHERE vendor_id = ?)
      ORDER BY id DESC LIMIT 50
    ),
    firsts AS (
      SELECT m.id AS conv, (SELECT MIN(id) FROM messages WHERE conversation_id = m.id AND sender_id <> ?) AS other_first FROM mine m
    )
    SELECT (julianday(r.created_at) - julianday(o.created_at)) * 1440 AS minutes
    FROM firsts f
    JOIN messages o ON o.id = f.other_first
    JOIN messages r ON r.id = (SELECT MIN(id) FROM messages WHERE conversation_id = f.conv AND sender_id = ? AND id > f.other_first)
  `);

  function replyTime(userId) {
    const mins = replies.all(userId, userId, userId, userId).map((r) => Math.max(0, r.minutes)).sort((a, b) => a - b);
    if (mins.length < 3) return null;
    const median = mins[Math.floor(mins.length / 2)];
    if (median <= 60) return 'hour';
    if (median <= 6 * 60) return 'hours';
    if (median <= 24 * 60) return 'day';
    return 'days';
  }

  // { lastSeenAt, replyTime: 'hour' | 'hours' | 'day' | 'days' | null }
  // Members who chose "Hide when I'm online" never have a lastSeenAt (it
  // isn't stored either; this is a second safety net). Their reply time
  // still shows: it comes from their messages, not from tracking them.
  function summaryFor(userId) {
    const u = seen.get(userId);
    return { lastSeenAt: u && !u.hide_activity ? u.last_seen_at : null, replyTime: replyTime(userId) };
  }
  return { summaryFor, replyTime };
}
