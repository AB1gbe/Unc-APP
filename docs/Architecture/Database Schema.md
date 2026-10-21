---
tags: [architecture, database]
---
# Database Schema

Source of truth: `server/src/db.js` → `MIGRATIONS`: migration 1 = initial schema, 2 = `password_resets` (session 02), 3 = performance indexes (session 05), 4 = `deals` + `ratings` (session 09), 5 = `users.language` (session 12). `PRAGMA user_version` = 5 on an up-to-date database (`MIGRATION_COUNT`). Database file: `server/data/unc.sqlite`.

```
users ─┬─< sessions
       ├─< password_resets
       ├─< deals (buyer/vendor, 1 per listing, 1 per conversation) ─< ratings (≤ 2 per deal)
       ├─< email_codes (1:1)
       ├─< kyc_submissions
       ├─< listings ─┬─< listing_images
       │             └─< conversations >── users (vendor)
       │                     └─< messages
       ├─< reports (→ listing or conversation)
       └─< audit_log
```

| Table | Key columns | Notes |
|---|---|---|
| `users` | language `en/ar/NULL` (session 12, NULL = no preference), email (unique), password_hash, display_name, account_type `individual/business`, role `user/admin`, email_verified_at, **kyc_status** `unverified/pending/approved/rejected`, banned_at | `kyc_status` is the fast flag every gate checks |
| `sessions` | token_hash (PK), user_id, expires_at | Only SHA-256 of the cookie token |
| `password_resets` | token_hash (PK), user_id, expires_at, used_at | Only SHA-256 of the emailed token; 30 min; single use. Added in migration 2 (session 02) |
| `email_codes` | user_id (PK), code_hash, expires_at, attempts | 6-digit code, peppered hash, 15 min, 5 tries |
| `kyc_submissions` | legal_name, date_of_birth, country, id_type, **id_number_last4**, **id_number_hash**, business_name, business_reg_number, doc_front, doc_back, selfie, business_doc, status, review_note, reviewer_id | Full ID number never stored. File columns hold random filenames in `uploads/kyc/` |
| `listings` | buyer_id, title, description, category, budget_min/max, currency, city, needed_by, status `open/fulfilled/closed` | The buyer's *request* |
| `listing_images` | listing_id, file | Up to 3, public |
| `conversations` | listing_id **NOT NULL**, buyer_id, vendor_id, last_message_at | `UNIQUE(listing_id, vendor_id)`, `CHECK(buyer_id <> vendor_id)` |
| `messages` | conversation_id, sender_id, body, offer_price, read_at | |
| `deals` | listing_id (unique), conversation_id (unique), buyer_id, vendor_id, created_at | Recorded when the buyer marks a request fulfilled and picks the seller. Session 09 |
| `ratings` | deal_id, rater_id, ratee_id, stars 1–5, comment, created_at | `UNIQUE(deal_id, rater_id)`; visibility rule in `lib/ratings.js`. Session 09 |
| `reports` | reporter_id, listing_id?, conversation_id?, reason, status | |
| `audit_log` | actor_id, action, target, meta (JSON) | KYC decisions, file views, bans, etc. |

## Indexes added in session 05 (migration 3)
| Index | Speeds up |
|---|---|
| `idx_conversations_buyer (buyer_id, last_message_at)` / `idx_conversations_vendor (vendor_id, last_message_at)` | inbox, unread counter |
| `idx_messages_unread (conversation_id, sender_id) WHERE read_at IS NULL` | unread counter, marking read (partial: only unread rows) |
| `idx_listings_buyer (buyer_id, created_at)` | My requests |
| `idx_listing_images (listing_id)` | photos per request |
| `idx_sessions_user (user_id)` | log out everywhere / bans |
Why: [[ADR-013 Performance]].

## Housekeeping
`cleanupExpired(db)` deletes expired sessions, expired email codes and expired/used reset links at start-up and every hour.

## How migrations work
- `PRAGMA user_version` stores how many migrations have run.
- On start, `migrate()` runs every migration after that number, each in a transaction.
- **To change the schema:** append a new string to `MIGRATIONS` (e.g. `ALTER TABLE users ADD COLUMN phone TEXT;`). **Never edit an old one** — existing databases have already run it.

## Inspect the database by hand
Install *DB Browser for SQLite* (free, https://sqlitebrowser.org) and open `server/data/unc.sqlite`. Stop the server first or open read-only.
