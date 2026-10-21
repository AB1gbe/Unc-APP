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
];

export function openDb(file = config.dbFile) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
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

export function audit(db, actorId, action, target, meta) {
  db.prepare('INSERT INTO audit_log (actor_id, action, target, meta) VALUES (?, ?, ?, ?)')
    .run(actorId ?? null, action, target ?? null, meta ? JSON.stringify(meta) : null);
}
