---
tags: [build-guide, activity]
step: 26
---
# Step 26: "Active now", reply time, "people looked at it" (session 20)

**What/why:** [[Social Touches]], [[ADR-026 Activity and privacy]].

1. Migration 13:
   ```sql
   ALTER TABLE users ADD COLUMN last_seen_at TEXT;
   CREATE TABLE listing_views (listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     first_seen_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (listing_id, user_id));
   ```
2. `server/src/middleware/auth.js` `loadUser`: if `last_seen_at` is empty or more than 60 s old, run `UPDATE users SET last_seen_at = datetime('now')`.
3. `server/src/lib/activity.js`: `activityQueries(db)` returns `{ summaryFor, replyTime }`.
   - The reply-time query is one SQL statement:
     - the member's newest 50 conversations, found as `UNION ALL` of the buyer and vendor indexes;
     - in each, the other side's first message, and the member's first message after it;
     - the minutes between those two messages.
   - The median of at least 3 is bucketed into `hour`, `hours`, `day` or `days`.
4. Show it only to logged-in members:
   - `routes/conversations.js`: `GET /conversations/:id` adds `otherActivity`;
   - `routes/ratings.js`: `member.activity`, only if `req.user`;
   - `routes/listings.js`: `buyer.activity`, only if `me`.
5. Views, in `routes/listings.js` `GET /:id`:
   - for a logged-in non-owner, `INSERT OR IGNORE INTO listing_views`;
   - the owner gets `viewCount`;
   - `/mine` rows get `viewCount`.
6. Client:
   - `Activity` in `ui.jsx` (a green dot for "Active now"), shown in the chat head, on the profile and on the request page (not for the owner, [[Mistakes and Fixes#M68]]);
   - "👀 N people looked at it · N offers" in `OwnerPanel` (Arabic plural forms in `ar.js`);
   - 👀 on `ListingCard`.
7. Tests:
   - `server/test/activity.test.js`;
   - index checks in `performance.test.js`;
   - `e2e/smoke.mjs` checks `.chat-head .active-now` and "1 person looked at it".
