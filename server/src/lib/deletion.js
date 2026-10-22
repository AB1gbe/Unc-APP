// "Delete my account" (session 37, PDPL). Asking starts a 7-day wait: the
// member can still log in and cancel. Then runDeletions() (hourly, see
// index.js) wipes the account:
// * identity documents (files and rows), photos, profile, settings,
//   requests' photos, chat photos they sent;
// * the user row stays as "Deleted member" (so other people's chats,
//   deals and ratings still make sense), hidden like a banned account;
// * the audit log keeps only the member's number, never their name.
// A member who was BANNED keeps their ID number's fingerprint in
// banned_id_hashes, so deleting can't be used to come back.
import fs from 'node:fs';
import path from 'node:path';
import { tx } from '../db.js';
import { randomToken } from './crypto.js';
import { AVATAR_DIR, CHAT_DIR, COVER_DIR, KYC_DIR, LISTING_DIR, STORY_DIR } from './uploads.js';

export const DELETE_AFTER_DAYS = 7;
export const DELETED_NAME = 'Deleted member';

const rm = (dir, file) => file && fs.rmSync(path.join(dir(), path.basename(file)), { force: true });

export function runDeletions(db) {
  const due = db.prepare(`
    SELECT * FROM users WHERE deleted_at IS NULL AND delete_requested_at IS NOT NULL
      AND delete_requested_at <= datetime('now', '-${DELETE_AFTER_DAYS} days')
  `).all();
  for (const u of due) deleteNow(db, u);
  return due.length;
}

export function deleteNow(db, u) {
  const files = [];
  tx(db, () => {
    const kyc = db.prepare('SELECT * FROM kyc_submissions WHERE user_id = ?').all(u.id);
    if (u.banned_at) {
      for (const k of kyc) db.prepare('INSERT OR IGNORE INTO banned_id_hashes (id_number_hash) VALUES (?)').run(k.id_number_hash);
    }
    for (const k of kyc) for (const f of [k.doc_front, k.doc_back, k.selfie, k.business_doc]) files.push([KYC_DIR, f]);
    db.prepare('DELETE FROM kyc_submissions WHERE user_id = ?').run(u.id);

    for (const i of db.prepare('SELECT li.id, li.file FROM listing_images li JOIN listings l ON l.id = li.listing_id WHERE l.buyer_id = ?').all(u.id)) {
      files.push([LISTING_DIR, i.file]);
      db.prepare('DELETE FROM listing_images WHERE id = ?').run(i.id);
    }
    for (const m of db.prepare('SELECT id, image FROM messages WHERE sender_id = ? AND image IS NOT NULL').all(u.id)) {
      files.push([CHAT_DIR, m.image]);
      db.prepare('UPDATE messages SET image = NULL WHERE id = ?').run(m.id);
    }
    for (const s of db.prepare('SELECT image FROM stories WHERE author_id = ? AND image IS NOT NULL').all(u.id)) files.push([STORY_DIR, s.image]);
    db.prepare('DELETE FROM stories WHERE author_id = ?').run(u.id);
    files.push([AVATAR_DIR, u.avatar], [COVER_DIR, u.cover]);

    db.prepare(`UPDATE listings SET status = 'closed', updated_at = datetime('now') WHERE buyer_id = ? AND status = 'open'`).run(u.id);
    for (const table of ['sessions', 'email_codes', 'password_resets', 'push_subscriptions', 'alerts', 'saved_listings', 'notifications', 'listing_views']) {
      db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(u.id);
    }
    db.prepare('DELETE FROM favourites WHERE user_id = ? OR seller_id = ?').run(u.id, u.id);
    db.prepare('DELETE FROM blocks WHERE user_id = ? OR blocked_id = ?').run(u.id, u.id);
    db.prepare(`
      UPDATE users SET email = ?, password_hash = ?, display_name = ?, city = NULL, avatar = NULL, cover = NULL, bio = NULL,
        interests = '[]', shop_area = NULL, shop_hours = NULL, last_seen_at = NULL, short_name = 0,
        banned_at = COALESCE(banned_at, datetime('now')), deleted_at = datetime('now')
      WHERE id = ?
    `).run(`deleted-${u.id}@deleted.invalid`, `deleted:${randomToken()}`, DELETED_NAME, u.id);
    db.prepare(`INSERT INTO audit_log (actor_id, action, target) VALUES (NULL, 'user.deleted', ?)`).run(`user:${u.id}`);
  });
  // Files last: if anything above failed, nothing was removed.
  for (const [dir, file] of files) rm(dir, file);
}

// Everything Unc holds about a member, as one JSON file ("Download my
// data"). Other people's messages are left out: they are their data.
export function exportData(db, u) {
  const all = (sql, ...p) => db.prepare(sql).all(...p);
  return {
    exportedAt: new Date().toISOString(),
    profile: {
      email: u.email, displayName: u.display_name, accountType: u.account_type, city: u.city, bio: u.bio,
      interests: JSON.parse(u.interests || '[]'), language: u.language, createdAt: u.created_at,
      shopArea: u.shop_area, shopHours: u.shop_hours ? JSON.parse(u.shop_hours) : null,
      settings: { emailOffers: u.email_offers !== 0, hideActivity: u.hide_activity === 1, shortName: u.short_name === 1 },
    },
    // Never the full ID number: only what the identity check kept.
    identityChecks: all(`SELECT legal_name AS legalName, date_of_birth AS dateOfBirth, country, id_type AS idType,
      id_number_last4 AS idNumberLast4, business_name AS businessName, status, submitted_at AS submittedAt, reviewed_at AS reviewedAt
      FROM kyc_submissions WHERE user_id = ? ORDER BY id`, u.id),
    requests: all(`SELECT id, title, description, category, budget_min AS budgetMin, budget_max AS budgetMax, currency, city,
      needed_by AS neededBy, status, contact_rule AS contactRule, created_at AS createdAt FROM listings WHERE buyer_id = ? ORDER BY id`, u.id),
    conversations: all(`SELECT c.id, c.listing_id AS requestId, l.title AS requestTitle,
      CASE WHEN c.buyer_id = ? THEN 'buyer' ELSE 'seller' END AS myRole, c.created_at AS startedAt
      FROM conversations c JOIN listings l ON l.id = c.listing_id WHERE c.buyer_id = ? OR c.vendor_id = ? ORDER BY c.id`, u.id, u.id, u.id),
    myMessages: all(`SELECT conversation_id AS conversationId, body, offer_price AS price, created_at AS sentAt
      FROM messages WHERE sender_id = ? ORDER BY id`, u.id),
    deals: all(`SELECT id, listing_id AS requestId, CASE WHEN buyer_id = ? THEN 'buyer' ELSE 'seller' END AS myRole, created_at AS createdAt
      FROM deals WHERE buyer_id = ? OR vendor_id = ? ORDER BY id`, u.id, u.id, u.id),
    ratingsGiven: all('SELECT deal_id AS dealId, stars, comment, created_at AS createdAt FROM ratings WHERE rater_id = ? ORDER BY id', u.id),
    ratingsReceived: all('SELECT deal_id AS dealId, stars, comment, created_at AS createdAt FROM ratings WHERE ratee_id = ? ORDER BY id', u.id),
    stories: all('SELECT deal_id AS dealId, body, created_at AS createdAt FROM stories WHERE author_id = ? ORDER BY id', u.id),
    alerts: all('SELECT q, category, city, min_budget AS minBudget, created_at AS createdAt FROM alerts WHERE user_id = ? ORDER BY id', u.id),
    favouriteSellers: all('SELECT seller_id AS memberId, created_at AS createdAt FROM favourites WHERE user_id = ? ORDER BY created_at', u.id),
    savedRequests: all('SELECT listing_id AS requestId, created_at AS createdAt FROM saved_listings WHERE user_id = ? ORDER BY created_at', u.id),
    blockedMembers: all('SELECT blocked_id AS memberId, created_at AS createdAt FROM blocks WHERE user_id = ? ORDER BY created_at', u.id),
    reportsMade: all('SELECT reason, kind, status, created_at AS createdAt FROM reports WHERE reporter_id = ? ORDER BY id', u.id),
  };
}
