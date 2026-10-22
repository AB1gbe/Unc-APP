// In-app notifications (the 🔔). Only events the Messages badge doesn't
// already cover: a new offer on your request, your offer picked as the
// deal, a rating left for you, your identity check result, and (session
// 28) a member who favourited you posting a request in your categories.
// The text is written by the app (client/src/pages/Notifications.jsx) from
// `kind`, so it shows in the reader's language.
export const KINDS = ['offer', 'deal', 'rating', 'kyc_approved', 'kyc_rejected', 'favourite-request'];

export function notify(db, userId, kind, { actorId = null, listingId = null, conversationId = null } = {}) {
  if (!KINDS.includes(kind)) throw new Error(`unknown notification kind: ${kind}`);
  db.prepare('INSERT INTO notifications (user_id, kind, actor_id, listing_id, conversation_id) VALUES (?, ?, ?, ?, ?)')
    .run(userId, kind, actorId, listingId, conversationId);
}
