---
tags: [architecture, api]
---
# API Reference

All JSON (gzip-compressed when larger than 1 KB). Send `Accept-Language: ar` to get error messages in Arabic (the website always sends its current language). Upload mistakes → 400/413, unreadable JSON → 400. Errors: `{ "error": "message", "field"?: "...", "code"?: "..." }`. Auth = session cookie.
Gate legend: — public · **A** logged in · **V** verified (email + KYC) · **ADM** admin.
Files: `/uploads/listings/*` and `/uploads/avatars/*` are public static files; `uploads/kyc` and `uploads/chat` are **never** static — only through the checked routes below.

## Meta
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/health` | — | `{ok:true}` |
| GET | `/api/meta` | — | categories + currencies |

## Auth — `server/src/routes/auth.js`
| Method | Path | Gate | Body → Response |
|---|---|---|---|
| POST | `/api/auth/register` | — | `email, password, displayName, accountType, city?` → `201 {user, devCode?}` + cookie |
| POST | `/api/auth/login` | — | `email, password` → `{user}` + cookie |
| POST | `/api/auth/logout` | — | clears session |
| GET | `/api/auth/me` | — | `{user}` or `{user:null}`. `user` includes `avatarUrl, bio, interests, onboarded` (session 13) |
| PUT | `/api/auth/language` | A | `language: en/ar` — saves the member's language (emails use it). Session 12 |
| PATCH | `/api/auth/me` | A | any of `displayName, city, bio (≤300), interests (≤8 categories)` — only the fields sent are changed → `{user}`. Session 13 |
| POST | `/api/auth/avatar` | A | **multipart** file `avatar` → `201 {user}`; replaces (and deletes) the old photo. Session 13 |
| DELETE | `/api/auth/avatar` | A | removes the profile photo → `{user}`. Session 13 |
| POST | `/api/auth/onboarded` | A | welcome step finished or skipped → `{user}` with `onboarded: true`. Session 13 |
| POST | `/api/auth/verify-email` | A | `code` (6 digits). 5 wrong tries → 429 |
| POST | `/api/auth/resend-code` | A | `{ok, devCode?}` |

| POST | `/api/auth/forgot-password` | — | `email` → always `{ok, message}` |
| POST | `/api/auth/reset-password/check` | — | `token` → `{ok}` or 400 `code: RESET_INVALID` |
| POST | `/api/auth/reset-password` | — | `token, password` → `{ok}`; ends all sessions |
| POST | `/api/auth/change-password` | A | `currentPassword, password` → `{ok}`; ends other sessions |

`register` also returns `emailSent: true/false`. `devCode` is included **only when NODE_ENV ≠ production and MAIL_TRANSPORT is console** (or in tests). `resend-code` → 502 if the email couldn't be sent.

## KYC — `server/src/routes/kyc.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/kyc` | A | `{kycStatus, submission}` (own, safe fields) |
| POST | `/api/kyc` | A + email verified | **multipart**: `legalName, dateOfBirth, country, idType, idNumber, businessName*, businessRegNumber*` + files `docFront, docBack (not for passport), selfie, businessDoc*` (*business accounts) |

## Requests — `server/src/routes/listings.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/listings?q=&category=&city=&page=` | — | open only, 20/page (page capped at 10,000), `{listings, page, hasMore}` |
| GET | `/api/listings/for-you` | A | Home page: up to 6 open requests in my interests (all if none), not mine, not already answered; my city first → `{listings, basedOnInterests}`. Session 13 |
| GET | `/api/listings/saved` | A | my saved requests that are still open, newest saved first (≤100). Session 13 |
| PUT | `/api/listings/:id/save` | A | save → `{saved:true}`; 404 if not open, 400 for your own request. Session 13 |
| DELETE | `/api/listings/:id/save` | A | unsave → `{saved:false}`. Session 13 |
| GET | `/api/listings/mine` | A | all statuses |
| GET | `/api/listings/:id` | — | non-open visible to owner, vendors with a conversation on it, admins; banned buyer's → 404 (except admins); adds `myConversationId` and `saved` for logged-in non-owners |
| POST | `/api/listings` | V | multipart: `title, description, category, budgetMin?, budgetMax?, currency?, city, neededBy?` + up to 6 `images` |
| PATCH | `/api/listings/:id` | V owner | JSON, open only |
| POST | `/api/listings/:id/images` | V owner | **multipart** `images`, open only, at most 6 in total → `201 {listing}`. Session 13 |
| DELETE | `/api/listings/:id/images/:imageId` | A owner | removes one photo (row + file) → `{listing}`. Session 13 |
| POST | `/api/listings/:id/status` | A owner | `status: open/fulfilled/closed`, optional `conversationId` with `fulfilled` = record the deal. 409 if changing a deal that was already rated |

## Conversations — `server/src/routes/conversations.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/listings/:id/contact` | V, not owner | `message, offerPrice?` (JSON, or multipart with optional file `image`) → **the only way to start a conversation**. 409 + `conversationId` if exists |
| GET | `/api/conversations` | A | my inbox with `lastMessage`, `unread`, `myRole` |
| GET | `/api/conversations/unread-count` | A | `{unread}` |
| GET | `/api/listings/:id/conversations` | A owner | offers on my request |
| GET | `/api/conversations/:id?after=<msgId>` | A participant | messages (only newer than `after`), each with `imageUrl` or null; marks other side's as read. Outsiders → 404 |
| GET | `/api/conversations/:id/images/:file` | A participant | streams a chat photo — **private**: only the two participants, and only a file that belongs to a message in this conversation (else 404). Session 13 |
| POST | `/api/conversations/:id/messages` | V participant | `message, offerPrice?` (vendor only); multipart with optional file `image` (then `message` may be empty). 409 if request not open or the other member is suspended |
| POST | `/api/reports` | A | `reason, listingId? / conversationId?` |

## Ratings & profiles — `server/src/routes/ratings.js` (session 09)
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/deals/:id/rating` | A, deal participant | `stars` 1–5, `comment?` (≤500). 404 for outsiders, 409 if already rated or after 30 days |
| GET | `/api/members/:id` | — | verified, non-banned members only: `{member: {id, displayName, accountType, memberSince, avatarUrl, bio, city, interests, deals, rating}, openRequests (≤6), reviews}` — no email, no contact (city/bio/photo added in session 13) |

Conversation objects also carry `other.rating`, `other.avatarUrl`, `deal` and `needsRating`; request details carry `buyer.rating` (+ `dealConversationId` for the owner).
Request objects (session 13) carry `photos: [{id, url}]` (use `id` to delete one), `buyer.avatarUrl`, and still the old `images: [url]` list. Reviews carry `from.avatarUrl`.

## Notifications — `server/src/routes/notifications.js` (session 13)
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/notifications` | A | newest 50: `{notifications: [{id, kind, actor?, listing?, conversationId, createdAt, read}], unread}` |
| GET | `/api/notifications/unread-count` | A | `{unread}` (the 🔔 badge) |
| POST | `/api/notifications/read` | A | marks all as read → `{unread:0}` |

Created by `notify()` in `server/src/lib/notify.js`: `offer` (new conversation on my request), `deal` (buyer picked my offer; removed if the deal is undone), `rating` (someone rated me), `kyc_approved` / `kyc_rejected`. New chat messages are **not** notifications (the Messages badge covers them).

## Push (phone notifications) — `server/src/routes/push.js` (session 15)
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/push/key` | — | `{publicKey}`: the server's public VAPID key (the browser needs it to subscribe) |
| POST | `/api/push/subscribe` | A | body = the browser's `subscription.toJSON()`: `{endpoint (https), keys: {p256dh, auth}}` → 201. Same endpoint again = updated / moved to this member. Max 10 devices per member (oldest dropped). |
| POST | `/api/push/unsubscribe` | A | `{endpoint}`: removes this device (also called on log out) |
| POST | `/api/push/test` | A | sends "Notifications are on" to all my devices → `{sent}`; 409 if none |

Sent by `pushTo()` in `server/src/lib/push.js`. Today only on a **new offer** (`POST /api/listings/:id/contact`, after the transaction), to the buyer, in their language. Push service answers 404/410 → that device is deleted.

## Admin — `server/src/routes/admin.js` (all ADM)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/stats` | counts |
| GET | `/api/admin/kyc?status=pending` | queue |
| GET | `/api/admin/kyc/:id` | details + file URLs + previous attempts |
| GET | `/api/admin/kyc/:id/file/:field` | streams private file (`doc_front, doc_back, selfie, business_doc`), logged |
| POST | `/api/admin/kyc/:id/decision` | `decision: approved/rejected, note` (note required to reject) |
| GET | `/api/admin/reports` | open reports |
| GET | `/api/admin/reports/:id/conversation` | read reported conversation (messages have `imageUrl`), logged |
| GET | `/api/admin/reports/:id/images/:file` | a photo from the reported conversation only; logged (`report.image_viewed`), `no-store`. Session 13 |
| POST | `/api/admin/reports/:id/resolve` | |
| POST | `/api/admin/users/:id/ban` | `banned: true/false` (real boolean, else 400); ban kills sessions |
