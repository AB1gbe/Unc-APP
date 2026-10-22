---
tags: [architecture, database]
---
# Database Schema

Source of truth: `server/src/db.js` → `MIGRATIONS`: migration 1 = initial schema, 2 = `password_resets` (session 02), 3 = performance indexes (session 05), 4 = `deals` + `ratings` (session 09), 5 = `users.language` (session 12), 6 = profile columns on `users`, 7 = `messages.image`, 8 = `saved_listings`, 9 = `notifications` (all session 13), 10 = `push_subscriptions` (session 15), 11 = `users.email_offers` (session 17), 12 = `messages.kind` + `messages.reply_to`, 13 = `users.last_seen_at` + `listing_views`, 14 = `stories` (all session 20), 15 = `users.hide_activity` (session 22), 16 = `users.cover` + `shop_area` + `shop_hours` (session 24), 17 = feed indexes `idx_deals_created`, `idx_conversations_created`, `idx_users_new_shops` (partial: business accounts) (session 26), 18 = `favourites` (session 28), 19 = `alerts` + `idx_alerts_user` + `idx_alerts_category`, 20 = `blocks` + `idx_blocks_blocked`, 21 = `listings.renewed_at` + `expiry_reminded_at` + `expired_at` (all session 31), 22 = `users.short_name` + `listings.contact_rule`, 23 = `messages.proof`, 24 = `messages.offer_condition` + `offer_warranty` + `offer_returns` + `offer_valid_until`, 25 = `reports.deal_id` + `reports.kind` + `idx_reports_deal` (all session 34), 26 = `users.delete_requested_at` + `deleted_at` + `banned_id_hashes`, 27 = `users.away_until` + `away_periods` + `idx_away_user`, 28 = `reports.outcome` + `listings.budget_raised_at` (all session 37). `PRAGMA user_version` = 28 on an up-to-date database (`MIGRATION_COUNT`). Database file: `server/data/unc.sqlite`.

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
       ├─< favourites >── users (seller)
       ├─< alerts (saved searches, ≤ 10 per member, session 31)
       ├─< blocks >── users (blocked member, session 31)
       ├─< away_periods (every time away mode was on, session 37)
       ├─< listings ─┬─< listing_images
       │             └─< conversations >── users (vendor)
       │                     └─< messages (optional private image; reply_to → the price message answered)
       ├─< reports (→ listing or conversation; deal? since session 34)
       └─< audit_log

banned_id_hashes (on its own: ID fingerprints of deleted banned members, session 37)
```

| Table | Key columns | Notes |
|---|---|---|
| `users` | language `en/ar/NULL` (session 12, NULL = no preference), avatar, bio, interests, onboarded_at (session 13, see below), email_offers `1/0` (session 17, default 1 = email me about new offers), last_seen_at (session 20, see below), hide_activity `0/1` (session 22: 1 = "Hide when I'm online"; `last_seen_at` is then cleared and not recorded), cover / shop_area / shop_hours (session 24, business accounts only: cover photo file in public `uploads/covers`, area text ≤80, hours JSON = 7 entries Sunday…Saturday, each `null` or `{open, close}` "HH:MM"), short_name `0/1` (session 34, see below), delete_requested_at / deleted_at / away_until (session 37, see below), email (unique), password_hash, display_name, account_type `individual/business`, role `user/admin`, email_verified_at, **kyc_status** `unverified/pending/approved/rejected`, banned_at | `kyc_status` is the fast flag every gate checks |
| `sessions` | token_hash (PK), user_id, expires_at | Only SHA-256 of the cookie token |
| `password_resets` | token_hash (PK), user_id, expires_at, used_at | Only SHA-256 of the emailed token; 30 min; single use. Added in migration 2 (session 02) |
| `email_codes` | user_id (PK), code_hash, expires_at, attempts | 6-digit code, peppered hash, 15 min, 5 tries |
| `kyc_submissions` | legal_name, date_of_birth, country, id_type, **id_number_last4**, **id_number_hash**, business_name, business_reg_number, doc_front, doc_back, selfie, business_doc, status, review_note, reviewer_id | Full ID number never stored. File columns hold random filenames in `uploads/kyc/` |
| `listings` | buyer_id, title, description, category, budget_min/max, currency, city, needed_by, status `open/fulfilled/closed`, renewed_at / expiry_reminded_at / expired_at (session 31, see below), contact_rule (session 34, see below), budget_raised_at (session 37, see below) | The buyer's *request*. `city` is free text, but known Bahrain areas are saved in one spelling by `normalizeCity()` (`shared/areas.js`, session 31) — same for `users.city` and `alerts.city` |
| `listing_images` | listing_id, file | Up to 6 (`MAX_PHOTOS`, was 3 before session 13), public in `uploads/listings/`; the owner can add/remove them later |
| `conversations` | listing_id **NOT NULL**, buyer_id, vendor_id, last_message_at | `UNIQUE(listing_id, vendor_id)`, `CHECK(buyer_id <> vendor_id)` |
| `messages` | conversation_id, sender_id, body, offer_price, read_at, image | `image` (migration 7, session 13) = random filename in `uploads/chat/` — **private**, only served to the two participants (and admins via a report). Body may be empty when a photo is attached. `kind` + `reply_to` (migration 12, session 20): see below. `proof` and the four `offer_*` columns (migrations 23–24, session 34): see below |
| `deals` | listing_id (unique), conversation_id (unique), buyer_id, vendor_id, created_at | Recorded when the buyer marks a request fulfilled and picks the seller. Session 09 |
| `ratings` | deal_id, rater_id, ratee_id, stars 1–5, comment, created_at | `UNIQUE(deal_id, rater_id)`; visibility rule in `lib/ratings.js`. Session 09 |
| `saved_listings` | user_id, listing_id, created_at | `PRIMARY KEY(user_id, listing_id)`; both `ON DELETE CASCADE`. The "♡ Save" list. Migration 8, session 13 |
| `notifications` | user_id, kind, actor_id?, listing_id?, conversation_id?, created_at, read_at | kind = `offer/deal/rating/kyc_approved/kyc_rejected/favourite-request/alert-match/expiring/expired/found-elsewhere/request-closed/report-action/report-no-action/budget-raised` (`KINDS` in `lib/notify.js`; `alert-match`, `expiring`, `expired` added in session 31, `found-elsewhere` and `request-closed` in session 34, `report-action`, `report-no-action` and `budget-raised` in session 37). No text stored: the app writes the wording from `kind`, in the reader's language. `actor_id` → `ON DELETE SET NULL`, the rest cascade. Migration 9, session 13 |
| `push_subscriptions` | user_id, endpoint (UNIQUE), p256dh, auth, created_at | One row per phone/computer that turned on push notifications. `endpoint` is the push service's address for that device; `p256dh`/`auth` encrypt the message so only that device can read it. Cascade on user delete. Migration 10, session 15 |
| `listing_views` | listing_id, user_id, first_seen_at | `PRIMARY KEY(listing_id, user_id)`: each logged-in member counted once per request (never the buyer). Drives "👀 N people looked at it" (`viewCount`, owner only). Both cascade. Migration 13, session 20 |
| `stories` | deal_id, author_id, body (5–280 chars), image?, created_at, hidden_at | "Found it" stories. `UNIQUE(deal_id, author_id)`: buyer and seller may each share one per deal. `image` = random filename in `uploads/stories/` (**public**). `hidden_at` = hidden by an admin. Both cascade. Migration 14, session 20 |
| `favourites` | user_id, seller_id, created_at | `PRIMARY KEY(user_id, seller_id)` (my favourites), `idx_favourites_seller` (count on profiles); both cascade. Migration 18, session 28 |
| `alerts` | id, user_id, q?, category?, city?, min_budget?, created_at | Request alerts: a seller's saved search. Empty field = any; at least one is set (checked in `routes/alerts.js`), at most 10 per member. `idx_alerts_user` (my alerts), `idx_alerts_category` (matching every new request; checked in `server/test/performance.test.js`). Cascade on user delete. Migration 19, session 31 |
| `blocks` | user_id (blocker), blocked_id, created_at | `PRIMARY KEY(user_id, blocked_id)`; `idx_blocks_blocked` for the other direction. Both cascade. Rules in `server/src/lib/blocks.js`. Migration 20, session 31 |
| `reports` | reporter_id, listing_id?, conversation_id?, reason, status, deal_id?, kind?, outcome? | `deal_id` + `kind` (migration 25, session 34) and `outcome` (migration 28, session 37): see below |
| `away_periods` | id, user_id, starts_at, ends_at | One row each time a member turned on away mode. `ends_at` = the day after the last away day (or the moment they came back early). Reply times leave out messages that arrived inside one of these periods. `idx_away_user (user_id, ends_at)`. Cascade on user delete. Migration 27, session 37 |
| `banned_id_hashes` | id_number_hash (PK), created_at | The ID-number fingerprint (same hash as `kyc_submissions.id_number_hash`) of a **banned** member whose account was deleted, so the same ID can't verify a new account. Never the ID number itself. Migration 26, session 37 |
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

## Session 31 columns on `listings` (migration 21)
| Column | Notes |
|---|---|
| `renewed_at` | when the 30 days last restarted ("Keep it open" = `POST /api/listings/:id/renew`, or reopening via `/status`). The request expires 30 days after `COALESCE(renewed_at, created_at)` (`EXPIRES_AT_SQL` in `lib/expiry.js`) |
| `expiry_reminded_at` | when the "Still looking?" reminder (day 27) went out; cleared on renew/reopen so it can be sent again |
| `expired_at` | set when `runExpiry()` closed the request at day 30; cleared on reopen |

## Session 34 columns (migrations 22–25)
| Column | Notes |
|---|---|
| `users.short_name` | `INTEGER NOT NULL DEFAULT 0`. 1 = "Show only my first name": other members see "Sam B." instead of "Sam Buyer" (`nameFor()` in `shared/names.js`). Personal accounts only (shops always show their full name). Migration 22 |
| `listings.contact_rule` | `TEXT NOT NULL DEFAULT 'anyone'`: who may make offers on this request — `anyone`, `shops` (business accounts), `rated` (at least one visible rating and an average of 4★ or more), `favourites` (the buyer's favourite sellers). No `CHECK` in the database: the list is checked in code (`CONTACT_RULES` in `server/src/lib/contact.js`). Sellers who already have a conversation on the request are never cut off. Migration 22 |
| `messages.proof` | `NULL`, `'photo'` (the seller's photo showing the chat's code on paper) or `'ask'` (the buyer asked for one) (`CHECK`). A new column because `messages.kind` only allows `accept/decline`. Migration 23 |
| `messages.offer_condition` | `new / like-new / good / fair`, or NULL. Only on a seller's message with a price. Migration 24 |
| `messages.offer_warranty` | `none / 1m / 3m / 6m / 12m`, or NULL. Migration 24 |
| `messages.offer_returns` | `none / 3d / 7d`, or NULL. Migration 24 |
| `messages.offer_valid_until` | a date (`YYYY-MM-DD`), today up to 60 days ahead; the last day the price can be accepted. Migration 24 |
| `reports.deal_id` | the deal a "Something went wrong" report is about (`REFERENCES deals(id) ON DELETE SET NULL`); index `idx_reports_deal`. The report also points at the deal's conversation. Migration 25 |
| `reports.kind` | `not-as-described / no-show / payment / other` (`DEAL_PROBLEMS` in `server/src/routes/ratings.js`; checked in code, not in the database). NULL for ordinary reports. Migration 25 |

The offer-detail values are checked in `server/src/lib/offers.js`, not by the database. "What people are asking for" (`GET /api/demand`) reads open requests through `idx_listings_status (status, created_at)`, an index from migration 1 — no new index needed (checked in `server/test/performance.test.js`).

## Session 37 columns and tables (migrations 26–28)
| Column / table | Notes |
|---|---|
| `users.delete_requested_at` | When the member asked to delete their account ("Delete my account"). NULL = no request, or they cancelled. After 7 days (`DELETE_AFTER_DAYS` in `server/src/lib/deletion.js`) the account is wiped. Migration 26. See [[ADR-043 Download and delete my data]] |
| `users.deleted_at` | When the account was wiped. The row stays (so other people's chats, deals and ratings still make sense) but becomes "Deleted member", with a made-up email (`deleted-<id>@deleted.invalid`), an unusable password, no photo, bio or city, and `banned_at` set so it is hidden like a suspended account. Migration 26 |
| `banned_id_hashes` | New table, see above. Filled by `deleteNow()` only when the deleted member was banned. `POST /api/kyc` refuses an ID whose fingerprint is in it. Migration 26 |
| `users.away_until` | Away mode: the **last** away day (`YYYY-MM-DD`), from today up to 60 days ahead (`MAX_AWAY_DAYS` in `lib/activity.js`), or NULL. While away: no alert, favourite or budget heads-ups. From the day after, the member counts as back. Migration 27. See [[ADR-045 Away mode]] |
| `away_periods` | New table, see above. Written by `setAway()` in `lib/activity.js`: turning away mode on closes any running period and starts a new one; "I'm back" ends the running one now. Migration 27 |
| `reports.outcome` | `action` (the team did something) or `nothing` (nothing against the rules) (`CHECK`), or NULL (old reports, or resolved without an answer). Set by `POST /api/admin/reports/:id/resolve`; the reporter gets a 🔔 `report-action` / `report-no-action`. Migration 28. See [[ADR-047 Report follow-up and raise my budget]] |
| `listings.budget_raised_at` | When the buyer last used "Raise my budget" (`POST /api/listings/:id/budget`). Used to allow it only once every 24 hours. Migration 28 |

The owner dashboard (`GET /api/admin/metrics`, `server/src/lib/metrics.js`) adds no tables or columns: it counts rows already in `listings`, `conversations`, `deals` and `users`. See [[ADR-044 Owner dashboard]].

## Indexes added in session 13
| Index | Speeds up |
|---|---|
| `idx_saved_listing (listing_id)` | cascade/lookups by request (the primary key already covers "my saved list") |
| `idx_notifications_user (user_id, id)` | the 🔔 list, newest first |
| `idx_notifications_unread (user_id) WHERE read_at IS NULL` | the 🔔 unread badge (partial: only unread rows) |
| `idx_push_user (user_id)` | finding a member's devices when an offer arrives (session 15) |
Checked in `server/test/performance.test.js`.

## Housekeeping
`cleanupExpired(db)` deletes expired sessions, expired email codes and expired/used reset links at start-up and every hour. `runExpiry(db)` (`server/src/lib/expiry.js`, session 31) runs at the same times: it reminds buyers about open requests at day 27 and closes them at day 30. `runDeletions(db)` (`server/src/lib/deletion.js`, session 37) also runs at start-up and every hour: it wipes accounts whose 7-day wait is over.

## How migrations work
- `PRAGMA user_version` stores how many migrations have run.
- On start, `migrate()` runs every migration after that number, each in a transaction.
- **To change the schema:** append a new string to `MIGRATIONS` (e.g. `ALTER TABLE users ADD COLUMN phone TEXT;`). **Never edit an old one** — existing databases have already run it.

## Inspect the database by hand
Install *DB Browser for SQLite* (free, https://sqlitebrowser.org) and open `server/data/unc.sqlite`. Stop the server first or open read-only.
