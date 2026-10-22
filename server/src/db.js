// Database layer. Uses Node's built-in SQLite (node:sqlite) so there is no
// native module to compile. Schema changes are added as new entries in
// MIGRATIONS - never edit an old one, always append.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

const MIGRATIONS = [
  // 1: initial schema
  `
  CREATE TABLE users (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    email            TEXT NOT NULL UNIQUE,
    password_hash    TEXT NOT NULL,
    display_name     TEXT NOT NULL,
    account_type     TEXT NOT NULL CHECK (account_type IN ('individual','business')),
    role             TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
    city             TEXT,
    email_verified_at TEXT,
    kyc_status       TEXT NOT NULL DEFAULT 'unverified'
                     CHECK (kyc_status IN ('unverified','pending','approved','rejected')),
    banned_at        TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE email_codes (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    code_hash  TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE kyc_submissions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider            TEXT NOT NULL,
    legal_name          TEXT NOT NULL,
    date_of_birth       TEXT NOT NULL,
    country             TEXT NOT NULL,
    id_type             TEXT NOT NULL CHECK (id_type IN ('passport','national_id','drivers_license')),
    id_number_last4     TEXT NOT NULL,
    id_number_hash      TEXT NOT NULL,
    business_name       TEXT,
    business_reg_number TEXT,
    doc_front           TEXT NOT NULL,
    doc_back            TEXT,
    selfie              TEXT NOT NULL,
    business_doc        TEXT,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
    review_note         TEXT,
    reviewer_id         INTEGER REFERENCES users(id),
    submitted_at        TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at         TEXT
  );
  CREATE INDEX idx_kyc_status ON kyc_submissions(status);
  CREATE INDEX idx_kyc_idhash ON kyc_submissions(id_number_hash);

  CREATE TABLE listings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT NOT NULL,
    budget_min  INTEGER,
    budget_max  INTEGER,
    currency    TEXT NOT NULL DEFAULT 'USD',
    city        TEXT NOT NULL,
    needed_by   TEXT,
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','fulfilled','closed')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_listings_status ON listings(status, created_at);

  CREATE TABLE listing_images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    file       TEXT NOT NULL
  );

  -- A conversation ALWAYS belongs to exactly one listing, and there is at
  -- most one conversation per (listing, vendor). There is deliberately no
  -- way to create a conversation without a listing.
  CREATE TABLE conversations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id      INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (listing_id, vendor_id),
    CHECK (buyer_id <> vendor_id)
  );

  CREATE TABLE messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    offer_price     INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    read_at         TEXT
  );
  CREATE INDEX idx_messages_conv ON messages(conversation_id, id);

  CREATE TABLE reports (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id      INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id   INTEGER REFERENCES users(id),
    action     TEXT NOT NULL,
    target     TEXT,
    meta       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
  // 2: password reset tokens (only the SHA-256 of the token is stored)
  `
  CREATE TABLE password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_password_resets_user ON password_resets(user_id);
  `,
  // 3: indexes for the queries that run most often (measured in session 05:
  // the unread counter scanned every message on every poll)
  `
  CREATE INDEX idx_conversations_buyer  ON conversations(buyer_id, last_message_at);
  CREATE INDEX idx_conversations_vendor ON conversations(vendor_id, last_message_at);
  CREATE INDEX idx_listings_buyer       ON listings(buyer_id, created_at);
  CREATE INDEX idx_listing_images       ON listing_images(listing_id);
  -- Only unread messages are in this index, so it stays tiny.
  CREATE INDEX idx_messages_unread      ON messages(conversation_id, sender_id) WHERE read_at IS NULL;
  CREATE INDEX idx_sessions_user        ON sessions(user_id);
  `,
  // 4: deals + ratings (session 09). A deal = the buyer said "I bought it
  // from this vendor" when marking a request fulfilled. Only deals can be
  // rated, once per side.
  `
  CREATE TABLE deals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id      INTEGER NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    conversation_id INTEGER NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
    buyer_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (buyer_id <> vendor_id)
  );
  CREATE INDEX idx_deals_buyer  ON deals(buyer_id);
  CREATE INDEX idx_deals_vendor ON deals(vendor_id);

  CREATE TABLE ratings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_id    INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    rater_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ratee_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stars      INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (deal_id, rater_id),
    CHECK (rater_id <> ratee_id)
  );
  CREATE INDEX idx_ratings_ratee ON ratings(ratee_id, created_at);
  `,
  // 5: each member's language, so emails go out in it (session 12).
  // NULL = no preference yet (e.g. accounts made before this, the admin):
  // emails then use English, and the website keeps the browser's language.
  `
  ALTER TABLE users ADD COLUMN language TEXT CHECK (language IN ('en', 'ar'));
  `,
  // 6: profiles (session 13) - photo, short bio, interests (JSON list of
  // categories), and when the welcome steps were finished or skipped.
  `
  ALTER TABLE users ADD COLUMN avatar TEXT;
  ALTER TABLE users ADD COLUMN bio TEXT;
  ALTER TABLE users ADD COLUMN interests TEXT NOT NULL DEFAULT '[]';
  ALTER TABLE users ADD COLUMN onboarded_at TEXT;
  `,
  // 7: a photo in a chat message (session 13). PRIVATE: stored in
  // uploads/chat and only served to the two people in the conversation.
  `
  ALTER TABLE messages ADD COLUMN image TEXT;
  `,
  // 8: saved requests (session 13) - a member's "♥ save for later" list.
  `
  CREATE TABLE saved_listings (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, listing_id)
  );
  CREATE INDEX idx_saved_listing ON saved_listings(listing_id);
  `,
  // 9: notifications (session 13) - see server/src/lib/notify.js.
  `
  CREATE TABLE notifications (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind            TEXT NOT NULL,
    actor_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    listing_id      INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    read_at         TEXT
  );
  CREATE INDEX idx_notifications_user ON notifications(user_id, id);
  CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
  `,
  // 10: phone/computer push notifications (session 15) - one row per device
  // that said yes. See server/src/lib/push.js.
  `
  CREATE TABLE push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_push_user ON push_subscriptions(user_id);
  `,
  // 11: "email me about new offers" switch (session 17). On by default.
  `
  ALTER TABLE users ADD COLUMN email_offers INTEGER NOT NULL DEFAULT 1;
  `,
  // 12: answering a price in the chat (session 20). kind = NULL (normal
  // message), 'accept' or 'decline'; reply_to = the price message answered.
  `
  ALTER TABLE messages ADD COLUMN kind TEXT CHECK (kind IN ('accept', 'decline'));
  ALTER TABLE messages ADD COLUMN reply_to INTEGER REFERENCES messages(id) ON DELETE CASCADE;
  CREATE INDEX idx_messages_reply ON messages(reply_to) WHERE reply_to IS NOT NULL;
  `,
  // 13: activity (session 20): when a member was last seen, and which
  // members opened a request ("👀 Seen by 7 people", shown to its buyer).
  `
  ALTER TABLE users ADD COLUMN last_seen_at TEXT;
  CREATE TABLE listing_views (
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (listing_id, user_id)
  );
  `,
  // 14: "Found it" stories (session 20): after a deal, either side may
  // share a short public story with an optional photo. hidden_at = hidden
  // by an admin.
  `
  CREATE TABLE stories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_id    INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    image      TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    hidden_at  TEXT,
    UNIQUE (deal_id, author_id)
  );
  `,
  // 15: "Hide when I'm online" (session 22). While on, last_seen_at is not
  // kept at all, so "Active now" can't be shown or leaked.
  `
  ALTER TABLE users ADD COLUMN hide_activity INTEGER NOT NULL DEFAULT 0;
  `,
  // 16: shop pages for business accounts (session 24): a cover photo, the
  // area the shop is in, and opening hours (JSON, see lib/shop-hours.js).
  // Deliberately no phone, website or email: contact stays inside requests.
  `
  ALTER TABLE users ADD COLUMN cover TEXT;
  ALTER TABLE users ADD COLUMN shop_area TEXT;
  ALTER TABLE users ADD COLUMN shop_hours TEXT;
  `,
  // 17: indexes for the "Happening near you" feed (session 26): recent
  // deals, recent offers, and new shops.
  `
  CREATE INDEX idx_deals_created ON deals(created_at);
  CREATE INDEX idx_conversations_created ON conversations(created_at);
  CREATE INDEX idx_users_new_shops ON users(created_at) WHERE account_type = 'business';
  `,
  // 18: favourite sellers (session 28). user_id ♥s seller_id.
  `
  CREATE TABLE favourites (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, seller_id)
  );
  CREATE INDEX idx_favourites_seller ON favourites(seller_id);
  `,
  // 19: request alerts (session 31): saved searches that tell a seller
  // about matching new requests. Any field may be empty (= any).
  `
  CREATE TABLE alerts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    q          TEXT,
    category   TEXT,
    city       TEXT,
    min_budget INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_alerts_user ON alerts(user_id);
  CREATE INDEX idx_alerts_category ON alerts(category);
  `,
  // 20: blocking (session 31): user_id blocked blocked_id.
  `
  CREATE TABLE blocks (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, blocked_id)
  );
  CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);
  `,
  // 21: "Still looking?" expiry (session 31): when the 30 days restarted
  // (renewed or reopened), when the reminder went out, and when it expired.
  `
  ALTER TABLE listings ADD COLUMN renewed_at TEXT;
  ALTER TABLE listings ADD COLUMN expiry_reminded_at TEXT;
  ALTER TABLE listings ADD COLUMN expired_at TEXT;
  `,
  // 22: privacy (session 34): "show only my first name", and who may make
  // offers on a request (anyone | shops | rated | favourites).
  `
  ALTER TABLE users ADD COLUMN short_name INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE listings ADD COLUMN contact_rule TEXT NOT NULL DEFAULT 'anyone';
  `,
  // 23: proof photos (session 34): 'photo' = the seller's photo showing the
  // chat's code on paper; 'ask' = the buyer asked for one. (A new column
  // because messages.kind only allows accept/decline.)
  `
  ALTER TABLE messages ADD COLUMN proof TEXT CHECK (proof IN ('photo', 'ask'));
  `,
  // 24: offer details (session 34), on a seller's priced message.
  `
  ALTER TABLE messages ADD COLUMN offer_condition TEXT;
  ALTER TABLE messages ADD COLUMN offer_warranty TEXT;
  ALTER TABLE messages ADD COLUMN offer_returns TEXT;
  ALTER TABLE messages ADD COLUMN offer_valid_until TEXT;
  `,
  // 25: "Something went wrong" after a deal (session 34): a report about a
  // deal, with what kind of problem it was.
  `
  ALTER TABLE reports ADD COLUMN deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL;
  ALTER TABLE reports ADD COLUMN kind TEXT;
  CREATE INDEX idx_reports_deal ON reports(deal_id);
  `,
  // 26: "Delete my account" (session 37): when it was asked for (7 days to
  // cancel) and when it was done; ID fingerprints of deleted BANNED members,
  // so they can't verify a new account with the same document.
  `
  ALTER TABLE users ADD COLUMN delete_requested_at TEXT;
  ALTER TABLE users ADD COLUMN deleted_at TEXT;
  CREATE TABLE banned_id_hashes (
    id_number_hash TEXT PRIMARY KEY,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
  // 27: away mode (session 37): users.away_until (last away day) and every
  // away period, so reply times can leave those days out.
  `
  ALTER TABLE users ADD COLUMN away_until TEXT;
  CREATE TABLE away_periods (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    starts_at TEXT NOT NULL,
    ends_at   TEXT NOT NULL
  );
  CREATE INDEX idx_away_user ON away_periods(user_id, ends_at);
  `,
  // 28: report follow-up and "raise my budget" (session 37).
  `
  ALTER TABLE reports ADD COLUMN outcome TEXT CHECK (outcome IN ('action', 'nothing'));
  ALTER TABLE listings ADD COLUMN budget_raised_at TEXT;
  `,
  // 29: keeping deals on Unc (session 40): the message had a phone number,
  // email, link or @handle (hidden from the other person until a price is
  // agreed; counted for the owner dashboard).
  `
  ALTER TABLE messages ADD COLUMN had_contact INTEGER NOT NULL DEFAULT 0;
  `,
  // 30: "Did you get it?" (session 40): when the buyer was asked, so it's once.
  `
  ALTER TABLE conversations ADD COLUMN got_it_asked_at TEXT;
  `,
  // 31: the Terms (session 40): which version the member agreed to, and when.
  `
  ALTER TABLE users ADD COLUMN terms_version INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE users ADD COLUMN terms_accepted_at TEXT;
  `,
  // 32: payment cards (session 40). Never a card number: only the payment
  // company's token, the brand, the last 4 digits and the expiry.
  `
  CREATE TABLE payment_cards (
    user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    provider     TEXT NOT NULL,
    provider_ref TEXT NOT NULL,
    brand        TEXT NOT NULL,
    last4        TEXT NOT NULL,
    exp_month    INTEGER NOT NULL,
    exp_year     INTEGER NOT NULL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  ALTER TABLE users ADD COLUMN card_added_at TEXT;
  `,
  // 33: paying in parts (session 40). provider 'seller' = a plan the buyer
  // and seller agree (Unc records and reminds, no money through Unc);
  // 'partner' is kept for an installment company later.
  `
  CREATE TABLE installment_plans (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    buyer_id        INTEGER NOT NULL REFERENCES users(id),
    vendor_id       INTEGER NOT NULL REFERENCES users(id),
    proposed_by     INTEGER NOT NULL REFERENCES users(id),
    provider        TEXT NOT NULL DEFAULT 'seller' CHECK (provider IN ('seller', 'partner')),
    total           INTEGER NOT NULL,
    currency        TEXT NOT NULL,
    parts           INTEGER NOT NULL,
    every           TEXT NOT NULL CHECK (every IN ('week', '2weeks', 'month')),
    status          TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'declined', 'cancelled', 'completed')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    decided_at      TEXT
  );
  CREATE INDEX idx_plans_conversation ON installment_plans(conversation_id);
  CREATE TABLE installment_parts (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id           INTEGER NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
    n                 INTEGER NOT NULL,
    amount            INTEGER NOT NULL,
    due_on            TEXT NOT NULL,
    paid_at           TEXT,
    confirmed_at      TEXT,
    reminded_at       TEXT,
    late_notified_at  TEXT,
    UNIQUE (plan_id, n)
  );
  CREATE INDEX idx_parts_due ON installment_parts(due_on);
  `,
];

// How many migrations exist = the user_version of an up-to-date database.
export const MIGRATION_COUNT = MIGRATIONS.length;

export function openDb(file = config.dbFile) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  // Wait up to 5 s instead of failing with "database is locked" when another
  // process (e.g. `npm run seed`) is writing at the same moment.
  db.exec('PRAGMA busy_timeout = 5000;');
  if (file !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
    // Safe with WAL (no corruption on crash) and much faster writes than FULL.
    db.exec('PRAGMA synchronous = NORMAL;');
  }
  migrate(db);
  return db;
}

function migrate(db) {
  const { user_version: current } = db.prepare('PRAGMA user_version').get();
  for (let i = current; i < MIGRATIONS.length; i++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

// Small helper so route code reads cleanly: tx(db, () => { ... })
export function tx(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Deletes logins and reset links that can no longer be used. Called on
// start-up and then every hour (see index.js).
export function cleanupExpired(db) {
  const now = "datetime('now')";
  const sessions = db.prepare(`DELETE FROM sessions WHERE expires_at <= ${now}`).run().changes;
  const resets = db.prepare(`DELETE FROM password_resets WHERE expires_at <= ${now} OR used_at IS NOT NULL`).run().changes;
  const codes = db.prepare(`DELETE FROM email_codes WHERE expires_at <= ${now}`).run().changes;
  const notifications = db.prepare(`DELETE FROM notifications WHERE read_at IS NOT NULL AND created_at <= datetime('now', '-90 days')`).run().changes;
  return { sessions, resets, codes, notifications };
}

export function audit(db, actorId, action, target, meta) {
  db.prepare('INSERT INTO audit_log (actor_id, action, target, meta) VALUES (?, ?, ?, ?)')
    .run(actorId ?? null, action, target ?? null, meta ? JSON.stringify(meta) : null);
}
