---
tags: [architecture, api]
---
# API Reference

All JSON (gzip-compressed when larger than 1 KB). Send `Accept-Language: ar` to get error messages in Arabic (the website always sends its current language). Upload mistakes → 400/413, unreadable JSON → 400. Errors: `{ "error": "message", "field"?: "...", "code"?: "..." }`. Auth = session cookie.
Gate legend: — public · **A** logged in · **V** verified (email + KYC) · **ADM** admin.
Files: `/uploads/listings/*`, `/uploads/avatars/*` and `/uploads/stories/*` (session 20) are public static files; `uploads/kyc` and `uploads/chat` are **never** static — only through the checked routes below.

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
| PATCH | `/api/auth/me` | A | any of `displayName, city, bio (≤300), interests (≤8 categories), emailOffers (true/false, session 17), hideActivity (true/false, session 22; true also clears last_seen_at), shopArea (≤80) and shopHours (7 × null or {open, close}) — business accounts only, session 24`. `bio` and `shopArea` are refused (400) if they contain a phone number, link, email or @handle (`lib/contact-guard.js`, session 24) — only the fields sent are changed → `{user}`. Session 13 |
| POST | `/api/auth/avatar` | A | **multipart** file `avatar` → `201 {user}`; replaces (and deletes) the old photo. Session 13 |
| POST / DELETE | `/api/auth/cover` | A | Business accounts only (400 otherwise). **multipart** file `cover` → `201 {user}` with `coverUrl`; replaces the old one. DELETE removes it. Session 24 |
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
| GET | `/api/listings?q=&category=&city=&page=` | — | open only, 20/page (page capped at 10,000), `{listings, page, hasMore}`. Session 31: `city` may be a governorate name (`Capital Governorate`, `محافظة العاصمة`…) = all its areas; a known area matches however it is spelled. Logged in: requests from members I blocked are left out |
| GET | `/api/listings/for-you` | A | Home page: up to 6 open requests in my interests (all if none), not mine, not already answered, not from members I blocked (session 31); my city first → `{listings, basedOnInterests}`. Session 13 |
| GET | `/api/listings/saved` | A | my saved requests that are still open, newest saved first (≤100). Session 13 |
| PUT | `/api/listings/:id/save` | A | save → `{saved:true}`; 404 if not open, 400 for your own request. Session 13 |
| DELETE | `/api/listings/:id/save` | A | unsave → `{saved:false}`. Session 13 |
| GET | `/api/listings/mine` | A | all statuses; each row has `viewCount` (session 20) |
| GET | `/api/listings/:id` | — | non-open visible to owner, vendors with a conversation on it, admins; banned buyer's → 404 (except admins); adds `myConversationId` and `saved` for logged-in non-owners. Session 20: `buyer.badges` (everyone), `buyer.activity` (logged-in only), `viewCount` (owner only); a logged-in non-owner opening it is counted once in `listing_views`. Session 31: the owner also gets `expiresAt` (30 days after posting / last renewal) and `expiredAt` (set if it closed by itself) |
| POST | `/api/listings` | V | multipart: `title, description, category, budgetMin?, budgetMax?, currency?, city, neededBy?` + up to 6 `images`. `city` is tidied by `normalizeCity()` (session 31, also on PATCH). Afterwards `tellFavourites()` then `tellAlerts()` (session 31) — one notification per member per request |
| PATCH | `/api/listings/:id` | V owner | JSON, open only |
| POST | `/api/listings/:id/images` | V owner | **multipart** `images`, open only, at most 6 in total → `201 {listing}`. Session 13 |
| DELETE | `/api/listings/:id/images/:imageId` | A owner | removes one photo (row + file) → `{listing}`. Session 13 |
| POST | `/api/listings/:id/renew` | A owner | "Keep it open": another 30 days (sets `renewed_at`, clears the reminder) → `{listing}`; 409 if not open. Session 31 |
| POST | `/api/listings/:id/status` | A owner | `status: open/fulfilled/closed`, optional `conversationId` with `fulfilled` = record the deal. 409 if changing a deal that was already rated. Reopening (`open`) starts a fresh 30 days (session 31) |

## Conversations — `server/src/routes/conversations.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/listings/:id/contact` | V, not owner | `message, offerPrice?` (JSON, or multipart with optional file `image`) → **the only way to start a conversation**. 409 + `conversationId` if exists. 403 if either member blocked the other (session 31) |
| GET | `/api/conversations` | A | my inbox with `lastMessage`, `lastKind`, `lastPrice` (session 20), `unread`, `myRole` |
| GET | `/api/conversations/unread-count` | A | `{unread}` |
| GET | `/api/listings/:id/conversations` | A owner | offers on my request. Session 31: each also has `compare: {price, agreedPrice, firstMessage (≤140), photoUrl, replyTime, badges, unread}` for "Compare offers" — buyer only |
| GET | `/api/conversations/:id?after=<msgId>` | A participant | messages (only newer than `after`), each with `imageUrl` or null, `kind` (`accept/decline/null`) and `replyTo` (session 20); marks other side's as read. `conversation` also has `otherActivity` and `otherBadges` (session 20), `blocked` (a block either way) and `iBlocked` (I blocked them) (session 31). Outsiders → 404 |
| GET | `/api/conversations/:id/images/:file` | A participant | streams a chat photo — **private**: only the two participants, and only a file that belongs to a message in this conversation (else 404). Session 13 |
| POST | `/api/conversations/:id/messages` | V participant | `message, offerPrice?` — either side may send a price (seller's offer or buyer's counter-offer, session 20; before that vendor only); multipart with optional file `image`. `message` may be empty when a photo or a price is sent. 409 if request not open, the other member is suspended, or either blocked the other (session 31) |
| POST | `/api/conversations/:id/messages/:messageId/respond` | V participant | `action: accept/decline` → `201 {message}` (a `kind` message with `replyTo`). Only the other side's **newest** price, only once: 400 no price / own price, 409 newer price exists, already answered, request not open, other member suspended or a block either way (session 31). Audited `offer.accept/decline`. Session 20 |
| POST | `/api/reports` | A | `reason, listingId? / conversationId?` |

## Ratings & profiles — `server/src/routes/ratings.js` (session 09)
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/deals/:id/rating` | A, deal participant | `stars` 1–5, `comment?` (≤500). 404 for outsiders, 409 if already rated or after 30 days |
| GET | `/api/members/:id` | — | verified, non-banned members only: `{member: {id, displayName, accountType, memberSince, avatarUrl, bio, city, interests, deals, rating, activity, badges}, stories (≤6), openRequests (≤6), reviews}` — no email, no contact (city/bio/photo added in session 13; `activity` (logged-in only), `badges`, `stories` in session 20) |

Conversation objects also carry `other.rating`, `other.avatarUrl`, `deal` (with `myStory: true/false`, session 20) and `needsRating`; request details carry `buyer.rating` (+ `dealConversationId` for the owner).
Request objects (session 13) carry `photos: [{id, url}]` (use `id` to delete one), `buyer.avatarUrl`, and still the old `images: [url]` list. Reviews carry `from.avatarUrl`.

Session 20 shapes: `activity` = `{lastSeenAt, replyTime}` with `replyTime` = `hour/hours/day/days/null` (median over the member's 50 newest conversations, needs at least 3) — `server/src/lib/activity.js`. `badges` = list of `fast`, `top-finder`, `trusted`, `new` — rules in `server/src/lib/badges.js`.

## Stories — `server/src/routes/stories.js` (session 20)
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/stories` | — | newest 12 visible stories → `{stories: [{id, body, imageUrl, createdAt, author: {id, displayName, avatarUrl}, other: {id, displayName}, listingTitle}]}`. Hidden stories and stories involving a banned member are left out |
| POST | `/api/deals/:id/story` | A, deal participant | **multipart**: `story` (5–280 chars) + optional file `image` → `201 {ok}`. 404 for outsiders, 409 if I already shared one for this deal |
| DELETE | `/api/stories/:id` | A author | deletes my story and its photo → `{ok}`; 404 otherwise |
| POST | `/api/admin/stories/:id/hide` | ADM | sets `hidden_at`, audited `story.hidden` → `{ok}` |

## Notifications — `server/src/routes/notifications.js` (session 13)
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/notifications` | A | newest 50: `{notifications: [{id, kind, actor?, listing?, conversationId, createdAt, read}], unread}` |
| GET | `/api/notifications/unread-count` | A | `{unread}` (the 🔔 badge) |
| POST | `/api/notifications/read` | A | marks all as read → `{unread:0}` |

Created by `notify()` in `server/src/lib/notify.js`: `offer` (new conversation on my request), `deal` (buyer picked my offer; removed if the deal is undone), `rating` (someone rated me), `kyc_approved` / `kyc_rejected`, `favourite-request` (session 28), `alert-match` (a new request matched my alert), `expiring` (my request closes in 3 days), `expired` (it closed by itself) (session 31). New chat messages are **not** notifications (the Messages badge covers them).

## Push (phone notifications) — `server/src/routes/push.js` (session 15)
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/push/key` | — | `{publicKey}`: the server's public VAPID key (the browser needs it to subscribe) |
| POST | `/api/push/subscribe` | A | body = the browser's `subscription.toJSON()`: `{endpoint (https), keys: {p256dh, auth}}` → 201. Same endpoint again = updated / moved to this member. Max 10 devices per member (oldest dropped). |
| POST | `/api/push/unsubscribe` | A | `{endpoint}`: removes this device (also called on log out) |
| POST | `/api/push/test` | A | sends "Notifications are on" to all my devices → `{sent}`; 409 if none |

Sent by `pushTo()` in `server/src/lib/push.js`. A new offer also emails the buyer (`newOfferEmail`) when `users.email_offers` = 1 (session 17). Push: today only on a **new offer** (`POST /api/listings/:id/contact`, after the transaction), to the buyer, in their language. Push service answers 404/410 → that device is deleted. Also pushed: `favourite-request` (session 28), `alert-match` and `expiring` (session 31); `expired` is 🔔 only.

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

## Pages / link previews — `server/src/app.js` + `server/src/lib/previews.js` (session 20)
Only when the built website exists (`client/dist`, or `CLIENT_DIST`). Every non-API, non-upload `GET` returns `index.html` (`Cache-Control: no-cache`) with Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:locale`, `twitter:card`) inserted before `</head>`, so WhatsApp, X, iMessage… show a card. `/requests/:id` for an **open** request whose buyer isn't banned gets its title (also in `<title>`), price, city and first photo, in the buyer's language; every other page gets the general Unc card and `/icons/icon-512.png`. `og:url` / `og:image` are built from `APP_URL`.

**Shop fields (session 24):** `/api/auth/me` and `GET /api/members/:id` include `coverUrl`, `shopArea` and `shopHours` for business accounts only. `/uploads/covers/*` are public files.

## Feed — `server/src/routes/feed.js` (session 26)
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/feed` | — | `{city, items: [{kind, at, city, near, category?, listing?{id,title}, shop?{id,displayName}, count?}]}`, at most 8, from the last 7 days. The member's city comes first (`near`). Kinds: `found` (anonymous: city + category only), `request` (open, not your own), `shop` (new verified business), `offers-today` (2+ new conversations on requests in your city in 24 h). Private people are never named; banned members are left out. Works logged out (no `near`). |

## Favourite sellers — `server/src/routes/favourites.js` (session 28)
| Method | Path | Gate | Notes |
|---|---|---|---|
| PUT | `/api/members/:id/favourite` | A | ♥ a verified, non-banned member → `{favourite:true}`; twice is fine; yourself → 400; unknown/unverified → 404 |
| DELETE | `/api/members/:id/favourite` | A | → `{favourite:false}` |
| GET | `/api/favourites` | A | my favourite sellers `{sellers:[{id, displayName, avatarUrl, accountType, city}]}` |

Also: `GET /api/members/:id` → `member.favouriteCount` (everyone) and `member.favourite` (logged in). `GET /api/conversations/:id` → `conversation.otherFavourite`. `POST /api/listings` calls `tellFavourites()`: each favourite seller whose interests include the category (or who chose none) gets the notification kind `favourite-request` and a push.

## Request alerts — `server/src/routes/alerts.js` (session 31)
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/alerts` | A | my alerts, newest first → `{alerts: [{id, q, category, city, minBudget, createdAt}]}` |
| POST | `/api/alerts` | A | any of `q (≤80), category, city (≤80, tidied by normalizeCity), minBudget` — at least one (else 400); at most 10 per member (else 400) → `201 {alert}` |
| DELETE | `/api/alerts/:id` | A | deletes my alert → `{ok}`; 404 if not mine |

`POST /api/listings` calls `tellAlerts()` after `tellFavourites()`: every verified, non-banned member (not the buyer, no block either way) whose alert matches gets the notification kind `alert-match` and a push — once per request, even if they were already told as a favourite seller or have several matching alerts. Matching (`alertMatches()`): same category; city contained (or, for a governorate name, any area in it); the request's top budget ≥ `minBudget` (requests without a budget still match); every word of `q` in the title or description.

## Bahrain areas — `shared/areas.js` (session 31)
Not an endpoint: shared code used by the server and the website. `normalizeCity()` tidies known areas to one English spelling ("المنامة", "manama city" → `Manama`) in `register`, `PATCH /api/auth/me`, request create/update and alerts. `governorateNamed()` / `governorateOf()` / `areasOf()` power the governorate search in `GET /api/listings?city=` and the feed's `near` (same city **or** same governorate). Other places stay free text.

## Blocking — `server/src/routes/blocks.js` + `server/src/lib/blocks.js` (session 31)
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/members/:id/block` | A | → `{blocked:true}`; twice is fine; yourself → 400; unknown → 404. Also removes them from my favourites. Audited `member.blocked` |
| DELETE | `/api/members/:id/block` | A | → `{blocked:false}` |
| GET | `/api/blocks` | A | members I blocked → `{members:[{id, displayName, avatarUrl}]}` |

A block works both ways for contact (`blockedBetween()`): `contact` → 403, `messages` / `respond` → 409. The blocker no longer sees the blocked member's requests in browse, for-you and the feed (`NOT_BLOCKED_BUYER`). Favourite and alert heads-ups skip blocked pairs. The blocked member is never told. Scam warnings in chat are client-only (`client/src/scam.js`).

## Request expiry — `server/src/lib/expiry.js` (session 31)
`runExpiry(db)` runs at start-up and hourly (`server/src/index.js`). Day 27 of an open request (counted from `COALESCE(renewed_at, created_at)`): notification + push kind `expiring`, once. Day 30: status → `closed`, `expired_at` set, notification kind `expired`. "Keep it open" = `POST /api/listings/:id/renew`; reopening via `/status` also restarts the 30 days.
