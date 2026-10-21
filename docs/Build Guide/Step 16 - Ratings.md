---
tags: [build-guide, ratings]
step: 16
---
# Step 16 — Ratings (session 09)

**What/why:** [[Ratings]], [[ADR-015 Ratings]].

## 1. Database — migration 4 (append to `MIGRATIONS` in `server/src/db.js`)
Tables `deals` (`listing_id UNIQUE`, `conversation_id UNIQUE`, buyer, vendor, `created_at`) and `ratings` (`deal_id`, `rater_id`, `ratee_id`, `stars CHECK 1–5`, `comment`, `UNIQUE(deal_id, rater_id)`, `CHECK(rater_id <> ratee_id)`), plus indexes `idx_deals_buyer`, `idx_deals_vendor`, `idx_ratings_ratee`. Also export `MIGRATION_COUNT` so tests don't hard-code the version ([[Mistakes and Fixes#M37]]).

## 2. Rules — `server/src/lib/ratings.js`
`RATE_WINDOW_DAYS = 30`, `REVEAL_AFTER_DAYS = 14`, the `VISIBLE` SQL fragment (other side rated OR deal older than 14 days), `ratingQueries(db).summaryFor(userId)` → `{ average, count }`, `canStillRate(created_at)`.

## 3. Endpoints
- `listings.js` `POST /:id/status`: optional `conversationId` with `fulfilled` → in one `tx()`: remove/replace the old deal unless it has ratings (409), insert the new deal. `detailView()` adds `buyer.rating` and, for the owner, `dealConversationId`.
- `conversations.js` `view()`: `other.rating`, `deal` (`myRating`, `otherHasRated`, `theirRating` only after I rated, `canRate`), `needsRating`.
- New `routes/ratings.js`: `POST /api/deals/:id/rating`, `GET /api/members/:id`; mounted in `app.js` with `app.use('/api', ratingRoutes(db))`.

## 4. Client
- `ui.jsx`: `Stars`, `RatingBadge`, `StarInput` (real radio buttons → keyboard accessible). Styles at the end of `styles.css` ("Ratings").
- `ListingDetail.jsx` `OwnerPanel`: "I found it" → chooser (`.choice` radio cards) → `status: 'fulfilled', conversationId`.
- `Conversation.jsx` `DealBanner`; name links to `/members/:id`.
- `Inbox.jsx`: `★ Rate` badge. `MemberProfile.jsx` (lazy route `members/:id`). Account → "View my public profile".

## 5. Demo + tests
`seed.js` adds one rated deal. `server/test/ratings.test.js` (12 tests); `e2e/smoke.mjs` extended with the rating journey.
```
npm test        # 63 pass
npm run seed    # then log in as buyer@demo.local → My requests → the fulfilled iPhone request
```
