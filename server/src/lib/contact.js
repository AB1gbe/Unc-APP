// "Who may contact me" (session 34): per request, the buyer chooses which
// sellers may make an offer. Existing conversations are never cut off.
import { ratingQueries } from './ratings.js';

export const CONTACT_RULES = ['anyone', 'shops', 'rated', 'favourites'];
export const MIN_RATED_STARS = 4;

// Why this seller may NOT contact the request (the rule's name), or null.
export function contactBlocker(db, listing, seller) {
  const rule = listing.contact_rule || 'anyone';
  if (rule === 'shops' && seller.account_type !== 'business') return 'shops';
  if (rule === 'rated' && !isWellRated(db, seller.id)) return 'rated';
  if (rule === 'favourites' && !db.prepare('SELECT 1 FROM favourites WHERE user_id = ? AND seller_id = ?').get(listing.buyer_id, seller.id)) return 'favourites';
  return null;
}

export function isWellRated(db, userId) {
  const { average, count } = ratingQueries(db).summaryFor(userId);
  return count > 0 && average >= MIN_RATED_STARS;
}

// The same rule as SQL, for lists of requests (l = listings). Use with
// contactAllowedParams(db, me).
export const CONTACT_ALLOWED_SQL = `(l.contact_rule = 'anyone'
  OR (l.contact_rule = 'shops' AND ? = 'business')
  OR (l.contact_rule = 'rated' AND ? = 1)
  OR (l.contact_rule = 'favourites' AND EXISTS (SELECT 1 FROM favourites f WHERE f.user_id = l.buyer_id AND f.seller_id = ?)))`;
export const contactAllowedParams = (db, me) => [me.account_type, isWellRated(db, me.id) ? 1 : 0, me.id];

export const CONTACT_MESSAGES = {
  shops: 'Only shops can make offers on this request.',
  rated: 'Only sellers rated 4★ or more can make offers on this request.',
  favourites: "This request is only open to the buyer's favourite sellers.",
};
