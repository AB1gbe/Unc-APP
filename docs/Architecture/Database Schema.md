---
tags: [architecture, database]
---
# Database Schema

Source of truth: `server/src/db.js` → `MIGRATIONS` (0: initial schema, 1: `password_resets`). Database file: `server/data/unc.sqlite`.

```
users ─┬─< sessions
       ├─< password_resets
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
| `users` | email (unique), password_hash, display_name, account_type `individual/business`, role `user/admin`, email_verified_at, **kyc_status** `unverified/pending/approved/rejected`, banned_at | `kyc_status` is the fast flag every gate checks |
| `sessions` | token_hash (PK), user_id, expires_at | Only SHA-256 of the cookie token |
| `password_resets` | token_hash (PK), user_id, expires_at, used_at | Only SHA-256 of the emailed token; 30 min; single use. Added in migration 2 (session 02) |
| `email_codes` | user_id (PK), code_hash, expires_at, attempts | 6-digit code, peppered hash, 15 min, 5 tries |
| `kyc_submissions` | legal_name, date_of_birth, country, id_type, **id_number_last4**, **id_number_hash**, business_name, business_reg_number, doc_front, doc_back, selfie, business_doc, status, review_note, reviewer_id | Full ID number never stored. File columns hold random filenames in `uploads/kyc/` |
| `listings` | buyer_id, title, description, category, budget_min/max, currency, city, needed_by, status `open/fulfilled/closed` | The buyer's *request* |
| `listing_images` | listing_id, file | Up to 3, public |
| `conversations` | listing_id **NOT NULL**, buyer_id, vendor_id, last_message_at | `UNIQUE(listing_id, vendor_id)`, `CHECK(buyer_id <> vendor_id)` |
| `messages` | conversation_id, sender_id, body, offer_price, read_at | |
| `reports` | reporter_id, listing_id?, conversation_id?, reason, status | |
| `audit_log` | actor_id, action, target, meta (JSON) | KYC decisions, file views, bans, etc. |

## How migrations work
- `PRAGMA user_version` stores how many migrations have run.
- On start, `migrate()` runs every migration after that number, each in a transaction.
- **To change the schema:** append a new string to `MIGRATIONS` (e.g. `ALTER TABLE users ADD COLUMN phone TEXT;`). **Never edit an old one** — existing databases have already run it.

## Inspect the database by hand
Install *DB Browser for SQLite* (free, https://sqlitebrowser.org) and open `server/data/unc.sqlite`. Stop the server first or open read-only.
