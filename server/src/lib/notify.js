// In-app notifications (the 🔔). Only events the Messages badge doesn't
// already cover: a new offer on your request, your offer picked as the
// deal, a rating left for you, your identity check result, and (session
// 28) a member who favourited you posting a request in your categories.
// The text is written by the app (client/src/pages/Notifications.jsx) from
// `kind`, so it shows in the reader's language.
export const KINDS = ['offer', 'deal', 'rating', 'kyc_approved', 'kyc_rejected', 'favourite-request', 'alert-match', 'expiring', 'expired', 'found-elsewhere', 'request-closed', 'report-action', 'report-no-action', 'budget-raised'];

export function notify(db, userId, kind, { actorId = null, listingId = null, conversationId = null } = {}) {
  if (!KINDS.includes(kind)) throw new Error(`unknown notification kind: ${kind}`);
  db.prepare('INSERT INTO notifications (user_id, kind, actor_id, listing_id, conversation_id) VALUES (?, ?, ?, ?, ?)')
    .run(userId, kind, actorId, listingId, conversationId);
}

// When a request closes (found, closed, or after 30 days), every seller who
// made an offer and wasn't picked gets a short thank-you (session 34), so a
// chat doesn't just go quiet. 🔔 only, no push.
export function thankOtherSellers(db, listing, status) {
  const sellers = db.prepare(`
    SELECT c.id, c.vendor_id FROM conversations c
    WHERE c.listing_id = ? AND NOT EXISTS (SELECT 1 FROM deals d WHERE d.conversation_id = c.id)
  `).all(listing.id);
  const kind = status === 'fulfilled' ? 'found-elsewhere' : 'request-closed';
  for (const c of sellers) notify(db, c.vendor_id, kind, { actorId: listing.buyer_id, listingId: listing.id, conversationId: c.id });
  return sellers.length;
}
