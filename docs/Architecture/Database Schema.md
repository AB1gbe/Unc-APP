---
tags: [architecture, database]
---
# Database Schema

Source of truth: `server/src/db.js` → `MIGRATIONS`: migration 1 = initial schema, 2 = `password_resets` (session 02), 3 = performance indexes (session 05), 4 = `deals` + `ratings` (session 09), 5 = `users.language` (session 12), 6 = profile columns on `users`, 7 = `messages.image`, 8 = `saved_listings`, 9 = `notifications` (all session 13), 10 = `push_subscriptions` (session 15), 11 = `users.email_offers` (session 17), 12 = `messages.kind` + `messages.reply_to`, 13 = `users.last_seen_at` + `listing_views`, 14 = `stories` (all session 20), 15 = `users.hide_activity` (session 22), 16 = `users.cover` + `shop_area` + `shop_hours` (session 24), 17 = feed indexes `idx_deals_created`, `idx_conversations_created`, `idx_users_new_shops` (partial: business accounts) (session 26). `PRAGMA user_version` = 17 on an up-to-date database (`MIGRATION_COUNT`). Database file: `server/data/unc.sqlite`.

```
users ─┬─< sessions
       ├─< password_resets
       ├─< deals (buyer/vendor, 1 per listing, 1 per conversation) ─┬─< ratings (≤ 2 per deal)
       │                                                            └─< stories (≤ 2 per deal, 1 per side)
       ├─< email_codes (1:1)
       ├─< kyc_submissions
       ├─< saved_listings >── listings (a member's saved requests)
       ├─< listing_views >── listings (who opened a request, once each)
       ├─< notifications (→ actor user, listing?, conversation?)
       ├─< listings ─┬─< listing_images
       │             └─< conversations >── users (vendor)
       │                     └─< messages (optional private image; reply_to → the price message answered)
       ├─< reports (→ listing or conversation)
       └─< audit_log
```

| Table | Key columns | Notes |
|---|---|---|
| `users` | language `en/ar/NULL` (session 12, NULL = no preference), avatar, bio, interests, onboarded_at (session 13, see below), email_offers `1/0` (session 17, default 1 = email me about new offers), last_seen_at (session 20, see below), hide_activity `0/1` (session 22: 1 = "Hide when I'm online"; `last_seen_at` is then cleared and not recorded), cover / shop_area / shop_hours (session 24, business accounts only: cover photo file in public `uploads/covers`, area text ≤80, hours JSON = 7 entries Sunday…Saturday, each `null` or `{open, close}` "HH:MM"), email (unique), password_hash, display_name, account_type `individual/business`, role `user/admin`, email_verified_at, **kyc_status** `unverified/pending/approved/rejected`, banned_at | `kyc_status` is the fast flag every gate checks |
| `sessions` | token_hash (PK), user_id, expires_at | Only SHA-256 of the cookie token |
| `password_resets` | token_hash (PK), user_id, expires_at, used_at | Only SHA-256 of the emailed token; 30 min; single use. Added in migration 2 (session 02) |
| `email_codes` | user_id (PK), code_hash, expires_at, attempts | 6-digit code, peppered hash, 15 min, 5 tries |
| `kyc_submissions` | legal_name, date_of_birth, country, id_type, **id_number_last4**, **id_number_hash**, business_name, business_reg_number, doc_front, doc_back, selfie, business_doc, status, review_note, reviewer_id | Full ID number never stored. File columns hold random filenames in `uploads/kyc/` |
| `listings` | buyer_id, title, description, category, budget_min/max, currency, city, needed_by, status `open/fulfilled/closed` | The buyer's *request* |
| `listing_images` | listing_id, file | Up to 6 (`MAX_PHOTOS`, was 3 before session 13), public in `uploads/listings/`; the owner can add/remove them later |
| `conversations` | listing_id **NOT NULL**, buyer_id, vendor_id, last_message_at | `UNIQUE(listing_id, vendor_id)`, `CHECK(buyer_id <> vendor_id)` |
| `messages` | conversation_id, sender_id, body, offer_price, read_at, image | `image` (migration 7, session 13) = random filename in `uploads/chat/` — **private**, only served to the two participants (and admins via a report). Body may be empty when a photo is attached. `kind` + `reply_to` (migration 12, session 20): see below |
| `deals` | listing_id (unique), conversation_id (unique), buyer_id, vendor_id, created_at | Recorded when the buyer marks a request fulfilled and picks the seller. Session 09 |
| `ratings` | deal_id, rater_id, ratee_id, stars 1–5, comment, created_at | `UNIQUE(deal_id, rater_id)`; visibility rule in `lib/ratings.js`. Session 09 |
| `saved_listings` | user_id, listing_id, created_at | `PRIMARY KEY(user_id, listing_id)`; both `ON DELETE CASCADE`. The "♡ Save" list. Migration 8, session 13 |
| `notifications` | user_id, kind, actor_id?, listing_id?, conversation_id?, created_at, read_at | kind = `offer/deal/rating/kyc_approved/kyc_rejected` (`KINDS` in `lib/notify.js`). No text stored: the app writes the wording from `kind`, in the reader's language. `actor_id` → `ON DELETE SET NULL`, the rest cascade. Migration 9, session 13 |
| `push_subscriptions` | user_id, endpoint (UNIQUE), p256dh, auth, created_at | One row per phone/computer that turned on push notifications. `endpoint` is the push service's address for that device; `p256dh`/`auth` encrypt the message so only that device can read it. Cascade on user delete. Migration 10, session 15 |
| `listing_views` | listing_id, user_id, first_seen_at | `PRIMARY KEY(listing_id, user_id)`: each logged-in member counted once per request (never the buyer). Drives "👀 N people looked at it" (`viewCount`, owner only). Both cascade. Migration 13, session 20 |
| `stories` | deal_id, author_id, body (5–280 chars), image?, created_at, hidden_at | "Found it" stories. `UNIQUE(deal_id, author_id)`: buyer and seller may each share one per deal. `image` = random filename in `uploads/stories/` (**public**). `hidden_at` = hidden by an admin. Both cascade. Migration 14, session 20 |
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

## Profile columns on `users` (session 13, migration 6)
| Column | Notes |
|---|---|
| `avatar` | random filename in `uploads/avatars/` (public); NULL = show the first letter. Never the KYC selfie |
| `bio` | up to 300 characters |
| `interests` | `NOT NULL DEFAULT '[]'` — JSON list of up to 8 categories; drives `GET /api/listings/for-you` |
| `onboarded_at` | set when the welcome step is finished or skipped (`POST /api/auth/onboarded`) |

## Session 20 columns (migrations 12–13)
| Column | Notes |
|---|---|
| `messages.kind` | `NULL` = normal message, `'accept'` / `'decline'` = a one-tap answer to the other side's price (`CHECK`) |
| `messages.reply_to` | the price message that was answered (`REFERENCES messages(id) ON DELETE CASCADE`); a price can be answered only once |
| `users.last_seen_at` | set by `loadUser` (`server/src/middleware/auth.js`) at most once a minute; "🟢 Active now" = within 5 minutes (`ACTIVE_MINUTES` in `lib/activity.js`) |

Index `idx_messages_reply (reply_to) WHERE reply_to IS NOT NULL` (migration 12) answers "has this price been answered?". `listing_views` counts use its primary key (`sqlite_autoindex_listing_views_1`); that and the reply-time query in `lib/activity.js` are checked in `server/test/performance.test.js`.

## Indexes added in session 13
| Index | Speeds up |
|---|---|
| `idx_saved_listing (listing_id)` | cascade/lookups by request (the primary key already covers "my saved list") |
| `idx_notifications_user (user_id, id)` | the 🔔 list, newest first |
| `idx_notifications_unread (user_id) WHERE read_at IS NULL` | the 🔔 unread badge (partial: only unread rows) |
| `idx_push_user (user_id)` | finding a member's devices when an offer arrives (session 15) |
Checked in `server/test/performance.test.js`.

## Housekeeping
`cleanupExpired(db)` deletes expired sessions, expired email codes and expired/used reset links at start-up and every hour.

## How migrations work
- `PRAGMA user_version` stores how many migrations have run.
- On start, `migrate()` runs every migration after that number, each in a transaction.
- **To change the schema:** append a new string to `MIGRATIONS` (e.g. `ALTER TABLE users ADD COLUMN phone TEXT;`). **Never edit an old one** — existing databases have already run it.

## Inspect the database by hand
Install *DB Browser for SQLite* (free, https://sqlitebrowser.org) and open `server/data/unc.sqlite`. Stop the server first or open read-only.
