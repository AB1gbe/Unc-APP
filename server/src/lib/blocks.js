// Blocking (session 31). A block works both ways for contact: neither side
// can start or continue a conversation with the other. The blocker also
// stops seeing the blocked member's requests. The blocked member is never
// told; they just can't reach the blocker.

// Is there a block between these two members, in either direction?
export function blockedBetween(db, a, b) {
  return Boolean(db.prepare('SELECT 1 FROM blocks WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)').get(a, b, b, a));
}

// SQL to hide requests whose buyer the viewer blocked (bind the viewer's id once).
export const NOT_BLOCKED_BUYER = 'l.buyer_id NOT IN (SELECT blocked_id FROM blocks WHERE user_id = ?)';
