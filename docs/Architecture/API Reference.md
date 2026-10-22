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
| GET | `/api/auth/me` | — | `{user}` or `{user:null}`. `user` includes `avatarUrl, bio, interests, onboarded` (session 13), `shortName` true/false (session 34), `awayUntil` (last away day, or null once it has passed) and `deleteAt` (when the account will be deleted, or null) (session 37) |
| PUT | `/api/auth/language` | A | `language: en/ar` — saves the member's language (emails use it). Session 12 |
| PATCH | `/api/auth/me` | A | any of `displayName, city, bio (≤300), interests (≤8 categories), emailOffers (true/false, session 17), hideActivity (true/false, session 22; true also clears last_seen_at), shopArea (≤80) and shopHours (7 × null or {open, close}) — business accounts only, session 24, shortName (true/false, session 34: "Show only my first name"; 400 if not a real true/false, and 400 when a business account tries to turn it on — shops always show their full name), awayUntil (session 37, away mode: a date from today up to 60 days ahead = the last away day, or null = "I'm back"; any other date → 400)`. `bio` and `shopArea` are refused (400) if they contain a phone number, link, email or @handle (`lib/contact-guard.js`, session 24) — only the fields sent are changed → `{user}`. Session 13 |
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
| GET | `/api/auth/me/export` | A | "Download my data": a JSON file download (`unc-my-data-YYYY-MM-DD.json`, `no-store`) with my profile and settings, identity checks (last 4 digits of the ID only), requests, conversations, **my own** messages (not the other person's), deals, ratings given and received, stories, alerts, favourites, saved requests, blocked members and reports I made. Audited `user.exported`. Session 37 |
| POST | `/api/auth/me/delete` | A | "Delete my account": `password` → `{user}` with `deleteAt` (7 days from now). 400 for admins, 400 `field: password` if the password is wrong; same rate limit as change-password. Closes my open requests now and logs out my other devices (this one stays logged in so I can cancel). Asking twice keeps the first date. Audited `user.delete_requested`. Session 37, see [[ADR-043 Download and delete my data]] |
| POST | `/api/auth/me/delete/cancel` | A | "Keep my account" → `{user}` with `deleteAt: null`. Closed requests stay closed. Audited `user.delete_cancelled`. Session 37 |

`register` also returns `emailSent: true/false`. `devCode` is included **only when NODE_ENV ≠ production and MAIL_TRANSPORT is console** (or in tests). `resend-code` → 502 if the email couldn't be sent.

## KYC — `server/src/routes/kyc.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/kyc` | A | `{kycStatus, submission}` (own, safe fields) |
| POST | `/api/kyc` | A + email verified | **multipart**: `legalName, dateOfBirth, country, idType, idNumber, businessName*, businessRegNumber*` + files `docFront, docBack (not for passport), selfie, businessDoc*` (*business accounts). 409 "already linked to another account" if the ID is in use, or (session 37) belongs to a banned member who deleted their account (`banned_id_hashes`) |

## Requests — `server/src/routes/listings.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/listings?q=&category=&city=&page=` | — | open only, 20/page (page capped at 10,000), `{listings, page, hasMore}`. Session 31: `city` may be a governorate name (`Capital Governorate`, `محافظة العاصمة`…) = all its areas; a known area matches however it is spelled. Logged in: requests from members I blocked are left out |
| GET | `/api/listings/for-you` | A | Home page: up to 6 open requests in my interests (all if none), not mine, not already answered, not from members I blocked (session 31); my city first → `{listings, basedOnInterests}`. Session 13. Session 34: also leaves out requests whose "who can make offers" rule doesn't let me answer (`CONTACT_ALLOWED_SQL`) |
| GET | `/api/listings/saved` | A | my saved requests that are still open, newest saved first (≤100). Session 13 |
| PUT | `/api/listings/:id/save` | A | save → `{saved:true}`; 404 if not open, 400 for your own request. Session 13 |
| DELETE | `/api/listings/:id/save` | A | unsave → `{saved:false}`. Session 13 |
| GET | `/api/listings/mine` | A | all statuses; each row has `viewCount` (session 20) |
| GET | `/api/listings/:id` | — | non-open visible to owner, vendors with a conversation on it, admins; banned buyer's → 404 (except admins); adds `myConversationId` and `saved` for logged-in non-owners. Session 20: `buyer.badges` (everyone), `buyer.activity` (logged-in only), `viewCount` (owner only); a logged-in non-owner opening it is counted once in `listing_views`. Session 31: the owner also gets `expiresAt` (30 days after posting / last renewal) and `expiredAt` (set if it closed by itself). Session 34: logged-in non-owners also get `contactBlocked` = the rule that stops them making an offer (`shops` / `rated` / `favourites`) or null — always null once they have a conversation on it |
| POST | `/api/listings` | V | multipart: `title, description, category, budgetMin?, budgetMax?, currency?, city, neededBy?` + up to 6 `images`. `city` is tidied by `normalizeCity()` (session 31, also on PATCH). Afterwards `tellFavourites()` then `tellAlerts()` (session 31) — one notification per member per request. Session 34: optional `contactRule` (`anyone` default, `shops`, `rated`, `favourites`; also on PATCH); both heads-ups skip sellers the request isn't open to |
| PATCH | `/api/listings/:id` | V owner | JSON, open only |
| POST | `/api/listings/:id/images` | V owner | **multipart** `images`, open only, at most 6 in total → `201 {listing}`. Session 13 |
| DELETE | `/api/listings/:id/images/:imageId` | A owner | removes one photo (row + file) → `{listing}`. Session 13 |
| POST | `/api/listings/:id/renew` | A owner | "Keep it open": another 30 days (sets `renewed_at`, clears the reminder) → `{listing}`; 409 if not open. Session 31 |
| POST | `/api/listings/:id/status` | A owner | `status: open/fulfilled/closed`, optional `conversationId` with `fulfilled` = record the deal. 409 if changing a deal that was already rated. Reopening (`open`) starts a fresh 30 days (session 31). Session 34: when an **open** request becomes fulfilled or closed, `thankOtherSellers()` sends every seller who made an offer and wasn't picked a 🔔 `found-elsewhere` (fulfilled) or `request-closed` (closed) — not when a finished deal is changed later |
| POST | `/api/listings/:id/budget` | V owner | "Raise my budget" (session 37): `budgetMax` (whole number, higher than the current top of the budget, else 400) → `{listing, told}` (`told` = how many sellers were told). 409 if the request isn't open, or if the budget was already raised in the last 24 hours (`budget_raised_at`). Sellers who opened or saved the request get a 🔔 `budget-raised` (not pushed) — only verified, non-banned ones who aren't away, have no conversation on it yet, aren't blocked either way, and whom the "who can make offers" rule allows. Audited `listing.budget_raised`. See [[ADR-047 Report follow-up and raise my budget]] |

## Conversations — `server/src/routes/conversations.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/listings/:id/contact` | V, not owner | `message, offerPrice?` (JSON, or multipart with optional file `image`) → **the only way to start a conversation**. 409 + `conversationId` if exists. 403 if either member blocked the other (session 31). Session 34: 403 with the rule's message and `rule` when the request's "who can make offers" rule doesn't allow me; the first message may carry the offer details below |
| GET | `/api/conversations` | A | my inbox with `lastMessage`, `lastKind`, `lastPrice` (session 20), `unread`, `myRole`. Session 34: `lastKind` may be `proof-ask` |
| GET | `/api/conversations/unread-count` | A | `{unread}` |
| GET | `/api/listings/:id/conversations` | A owner | offers on my request. Session 31: each also has `compare: {price, agreedPrice, firstMessage (≤140), photoUrl, replyTime, badges, unread}` for "Compare offers" — buyer only. Session 34: also `details` (of the seller's newest price, or null) and `hasProof` (the seller sent a proof photo). Session 37: also `awayUntil` (the seller's last away day, or null) |
| GET | `/api/conversations/:id?after=<msgId>` | A participant | messages (only newer than `after`), each with `imageUrl` or null, `kind` (`accept/decline/null`) and `replyTo` (session 20); marks other side's as read. `conversation` also has `otherActivity` and `otherBadges` (session 20), `blocked` (a block either way) and `iBlocked` (I blocked them) (session 31). Session 34: `conversation.proofCode` (e.g. `UNC-4821`, made from a hash of the chat's id and start time); each message also has `proof` (true = a proof photo), `details` (`{condition, warranty, returns, validUntil, expired}` or null) and `kind` may be `proof-ask` (the buyer asked for a proof photo); `deal.myProblem` = `open` / `resolved` / null. Session 37: `conversation.listing.category` (for the pickup checklist). Outsiders → 404 |
| GET | `/api/conversations/:id/images/:file` | A participant | streams a chat photo — **private**: only the two participants, and only a file that belongs to a message in this conversation (else 404). Session 13 |
| POST | `/api/conversations/:id/messages` | V participant | `message, offerPrice?` — either side may send a price (seller's offer or buyer's counter-offer, session 20; before that vendor only); multipart with optional file `image`. `message` may be empty when a photo or a price is sent. 409 if request not open, the other member is suspended, or either blocked the other (session 31). Session 34: `proof=1` marks a photo as a proof photo (seller only, and only with a photo, else 400); `condition, warranty, returns, validUntil` = offer details (seller only, and only with a price, else 400; `validUntil` from today up to 60 days ahead) |
| POST | `/api/conversations/:id/messages/:messageId/respond` | V participant | `action: accept/decline` → `201 {message}` (a `kind` message with `replyTo`). Only the other side's **newest** price, only once: 400 no price / own price, 409 newer price exists, already answered, request not open, other member suspended or a block either way (session 31). Audited `offer.accept/decline`. Session 20. Session 34: `accept` on a price whose `validUntil` has passed → 409 |
| POST | `/api/conversations/:id/proof-request` | V participant | The **buyer** asks for a proof photo → `201 {message}` (a message with `kind: 'proof-ask'`). 403 for the seller; 409 if the request isn't open, a block either way, or my earlier ask has no proof photo after it yet. Session 34 |
| POST | `/api/reports` | A | `reason, listingId? / conversationId?` |

## Ratings & profiles — `server/src/routes/ratings.js` (session 09)
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/deals/:id/rating` | A, deal participant | `stars` 1–5, `comment?` (≤500). 404 for outsiders, 409 if already rated or after 30 days |
| POST | `/api/deals/:id/problem` | A, deal participant | "Something went wrong with this deal": `kind` (`not-as-described / no-show / payment / other`), `details` (10–1000 chars) → `201 {ok}`. Saved as a report on the deal's conversation (with `deal_id` and `kind`), so an admin can read that chat. 404 for outsiders, 409 if I already have an open one for this deal. Audited `deal.problem`. Session 34 |
| GET | `/api/members/:id` | — | verified, non-banned members only: `{member: {id, displayName, accountType, memberSince, avatarUrl, bio, city, interests, deals, rating, activity, badges}, stories (≤6), openRequests (≤6), reviews}` — no email, no contact (city/bio/photo added in session 13; `activity` (logged-in only), `badges`, `stories` in session 20). Session 34: `displayName` follows "Show only my first name" for everyone except the member themself |

Conversation objects also carry `other.rating`, `other.avatarUrl`, `deal` (with `myStory: true/false`, session 20) and `needsRating`; request details carry `buyer.rating` (+ `dealConversationId` for the owner).
Request objects (session 13) carry `photos: [{id, url}]` (use `id` to delete one), `buyer.avatarUrl`, and still the old `images: [url]` list. Reviews carry `from.avatarUrl`. Session 34: request objects also carry `contactRule`.

Session 20 shapes: `activity` = `{lastSeenAt, replyTime}` with `replyTime` = `hour/hours/day/days/null` (median over the member's 50 newest conversations, needs at least 3) — `server/src/lib/activity.js`. Session 37: `activity` also has `awayUntil` (the member's last away day, or null), so it shows on request pages (`buyer.activity`), profiles and chats (`otherActivity`); the reply time leaves out messages that arrived while the member was away (`away_periods`). `badges` = list of `fast`, `top-finder`, `trusted`, `new` — rules in `server/src/lib/badges.js`.

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

Created by `notify()` in `server/src/lib/notify.js`: `offer` (new conversation on my request), `deal` (buyer picked my offer; removed if the deal is undone), `rating` (someone rated me), `kyc_approved` / `kyc_rejected`, `favourite-request` (session 28), `alert-match` (a new request matched my alert), `expiring` (my request closes in 3 days), `expired` (it closed by itself) (session 31), `found-elsewhere` (the buyer found it with another seller) and `request-closed` (the request I made an offer on was closed, by the buyer or after 30 days) (session 34, from `thankOtherSellers()`), `report-action` / `report-no-action` (the team looked at my report and acted / found nothing; never says what happened to the other person) and `budget-raised` (a request I looked at or saved has a higher budget) (session 37). New chat messages are **not** notifications (the Messages badge covers them).

## Push (phone notifications) — `server/src/routes/push.js` (session 15)
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/push/key` | — | `{publicKey}`: the server's public VAPID key (the browser needs it to subscribe) |
| POST | `/api/push/subscribe` | A | body = the browser's `subscription.toJSON()`: `{endpoint (https), keys: {p256dh, auth}}` → 201. Same endpoint again = updated / moved to this member. Max 10 devices per member (oldest dropped). |
| POST | `/api/push/unsubscribe` | A | `{endpoint}`: removes this device (also called on log out) |
| POST | `/api/push/test` | A | sends "Notifications are on" to all my devices → `{sent}`; 409 if none |

Sent by `pushTo()` in `server/src/lib/push.js`. A new offer also emails the buyer (`newOfferEmail`) when `users.email_offers` = 1 (session 17). Push: today only on a **new offer** (`POST /api/listings/:id/contact`, after the transaction), to the buyer, in their language. Push service answers 404/410 → that device is deleted. Also pushed: `favourite-request` (session 28), `alert-match` and `expiring` (session 31); `expired` is 🔔 only, and so are `found-elsewhere` and `request-closed` (session 34), and `report-action`, `report-no-action` and `budget-raised` (session 37). Favourite and alert heads-ups (🔔 and push) skip sellers who are away (session 37, `NOT_AWAY` in `lib/activity.js`).

## Admin — `server/src/routes/admin.js` (all ADM)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/stats` | counts |
| GET | `/api/admin/metrics?days=` | The owner dashboard (session 37): `days` = 7, 30 (default; anything else → 30) or 90 → `{days, totals: {requests, offers, deals, members}, answeredShare, firstOfferHours, daily: [{day, requests, offers, deals, members}], categories: [{name, n}] (top 6), areas: [{name, n}]}`. `offers` = new conversations; `members` = new non-admin accounts (not deleted); `answeredShare` = % of requests at least a day old that got an offer (null if none); `firstOfferHours` = median hours to the first offer (null if none); `areas` = governorate (`Capital`, `Muharraq`, `Northern`, `Southern`) or `Other`. `server/src/lib/metrics.js`. See [[ADR-044 Owner dashboard]] |
| GET | `/api/admin/kyc?status=pending` | queue |
| GET | `/api/admin/kyc/:id` | details + file URLs + previous attempts |
| GET | `/api/admin/kyc/:id/file/:field` | streams private file (`doc_front, doc_back, selfie, business_doc`), logged |
| POST | `/api/admin/kyc/:id/decision` | `decision: approved/rejected, note` (note required to reject) |
| GET | `/api/admin/reports` | open reports. Session 34: each also has `deal_id` and `kind` (set for "Something went wrong" deal reports) |
| GET | `/api/admin/reports/:id/conversation` | read reported conversation (messages have `imageUrl`), logged |
| GET | `/api/admin/reports/:id/images/:file` | a photo from the reported conversation only; logged (`report.image_viewed`), `no-store`. Session 13 |
| POST | `/api/admin/reports/:id/resolve` | optional `outcome: action/nothing` (session 37; anything else → 400) → `{ok}`; 404 if no such report. Saves `outcome`; with an outcome, and only if the report was still open, the reporter gets a 🔔 `report-action` or `report-no-action` (linked to the request it was about). Audited `report.resolved` (with the outcome) |
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

## Names shown to others — `shared/names.js` (session 34)
Not an endpoint: shared code used by the server and the website. `shortName("Sam Buyer")` → `Sam B.` (one word stays as it is). `nameFor(name, short)` gives the short form when the member turned on "Show only my first name" (`users.short_name`). It is used for every name other members see: requests (`buyer.displayName`), conversations and the inbox, profiles (my own profile still shows my full name), reviews, stories, notifications (`actor`), favourites, the blocked list, and the favourite-seller push. In a chat, the buyer's full name shows to the seller once the buyer has sent a message in that chat.

## Who can make offers — `server/src/lib/contact.js` (session 34)
`CONTACT_RULES` = `anyone`, `shops`, `rated`, `favourites` (saved in `listings.contact_rule`). `contactBlocker(db, listing, seller)` returns the rule that stops a seller, or null; `isWellRated()` = at least one visible rating and an average of 4★ or more. `CONTACT_ALLOWED_SQL` + `contactAllowedParams()` apply the same rule inside a list query (for-you). Used by `contact` (403), the request page (`contactBlocked`), for-you, `tellFavourites()` and `tellAlerts()`. Sellers who already have a conversation keep talking.

## Proof photos and offer details — `server/src/lib/offers.js` (session 34)
Proof photo: the seller writes the chat's `proofCode` on paper next to the item and sends a photo with `proof=1`; the buyer can ask with `POST /api/conversations/:id/proof-request`. Offer details: `readOfferDetails()` reads `condition, warranty, returns, validUntil` (all optional; seller's price only; `validUntil` at most 60 days ahead), `offerDetailsView()` turns a message into `{condition, warranty, returns, validUntil, expired}`, `isExpired()` = `validUntil` is before today.

## What people are asking for — `server/src/routes/demand.js` (session 34)
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/demand?area=` | V | `{days: 30, area, categories: [{category, requests, waiting, words}]}`: open requests from the last 30 days (buyer not banned), grouped by category. `waiting` = no offer yet; `words` = up to 3 words used in the titles of 2+ waiting requests. A category shows only with 2+ requests; most waiting first. `area` = a governorate key from `shared/areas.js` (`Capital`, `Muharraq`, `Northern`, `Southern`; anything else is ignored). Looks at the newest 5000 requests at most, using `idx_listings_status`. Counts only — no names, no single request's words |

## Your data and deleting an account — `server/src/lib/deletion.js` (session 37)
`exportData(db, user)` builds the "Download my data" file. `runDeletions(db)` runs at start-up and hourly (`server/src/index.js`) and calls `deleteNow()` for every account asked to be deleted more than 7 days ago (`DELETE_AFTER_DAYS`). `deleteNow()`: deletes identity documents (rows and files), request photos, chat photos the member sent, stories, profile/cover photos, sessions, codes, reset links, devices, alerts, saved requests, notifications, views, favourites (both ways) and blocks (both ways); closes open requests; renames the account "Deleted member" (`DELETED_NAME`) and marks it banned; keeps chats, deals and ratings for the other people. A **banned** member's ID fingerprint is kept in `banned_id_hashes`. The audit log gets `user.deleted` with only the member's number. Files are removed only after the database changes succeed. See [[ADR-043 Download and delete my data]] and [[Your Data, Dashboard and Care]].

## Away mode — `server/src/lib/activity.js` (session 37)
`setAway(db, userId, until)` saves `users.away_until` and an `away_periods` row (via `PATCH /api/auth/me` `awayUntil`). `NOT_AWAY` = SQL used by `tellFavourites()`, `tellAlerts()` and "Raise my budget" to skip away sellers. `MAX_AWAY_DAYS` = 60. Messages that arrive during an away period don't count towards reply time. See [[ADR-045 Away mode]].

## Pickup checklist — `client/src/pickup.js` (session 37)
Not an endpoint: website-only rules (tested by `server/test/pickup.test.js`). `checklistFor(category)` = the checks for that category, always ending with the three common ones. `isBigDeal(price, currency)` = the price is at or above `BIG_DEAL` for that currency (e.g. BHD 200, USD 500); currencies not in the list never count. Shown in a chat once a price is accepted or a deal is recorded; the ticks are kept only on that device. See [[ADR-046 Pickup checklist and big-deal card]].
