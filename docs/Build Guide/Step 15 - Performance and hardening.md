---
tags: [build-guide, performance, security]
step: 15
---
# Step 15 — Performance and hardening (session 05)

**Why:** [[ADR-013 Performance]], [[ADR-014 Rate limiting]]. **Every bug fixed:** [[Mistakes and Fixes#M24 – M35: bugs found by the code review (session 05)]].

## 1. Measure (how to repeat it yourself)
1. Make a big database: write a small script that inserts thousands of users/requests/conversations/messages in one transaction (`BEGIN` … `COMMIT` — without it, inserting 200k rows takes minutes).
2. Time endpoints with a loop of `fetch()` calls and `performance.now()`.
3. For each slow one, run `EXPLAIN QUERY PLAN <the SQL>` in DB Browser for SQLite. `SCAN <table>` on a big table = missing index. `SEARCH … USING INDEX` = good.

## 2. Indexes — migration 3 in `server/src/db.js` (appended, never edit old ones)
```sql
CREATE INDEX idx_conversations_buyer  ON conversations(buyer_id, last_message_at);
CREATE INDEX idx_conversations_vendor ON conversations(vendor_id, last_message_at);
CREATE INDEX idx_listings_buyer       ON listings(buyer_id, created_at);
CREATE INDEX idx_listing_images       ON listing_images(listing_id);
CREATE INDEX idx_messages_unread      ON messages(conversation_id, sender_id) WHERE read_at IS NULL;
CREATE INDEX idx_sessions_user        ON sessions(user_id);
```
Existing databases get these automatically on next start.

## 3. Rewrite OR-queries (`server/src/routes/conversations.js`)
```sql
-- before: WHERE c.buyer_id = ? OR c.vendor_id = ?        (full scan)
-- after:
WHERE c.id IN (SELECT id FROM conversations WHERE buyer_id = ?
               UNION ALL
               SELECT id FROM conversations WHERE vendor_id = ?)
```
Chat poll: `hasUnread` (SELECT 1 … LIMIT 1) before `markRead` (UPDATE).

## 4. Server settings
- `npm install compression@1 --workspace server`; `app.use(compression())` in `app.js`.
- Static files: `/assets` with `{ immutable: true, maxAge: '365d' }`; everything else and the `index.html` fallback with `Cache-Control: no-cache`; listing photos `immutable, 365d`.
- `db.js`: `PRAGMA busy_timeout = 5000`, `PRAGMA synchronous = NORMAL`; `cleanupExpired(db)` called at start and hourly (`index.js`, timer `.unref()`).
- `config.js` `trustProxy` from `TRUST_PROXY`; `app.set('trust proxy', config.trustProxy)`.

## 5. Client
- `App.jsx`: rarely used pages via `lazy(() => import('./pages/X.jsx'))`; `<Suspense fallback={<Loading/>}>` around `<Outlet/>` in `Layout.jsx` (not around the whole app — [[Mistakes and Fixes#M21]]).
- `hooks.js`: `usePolling(fn, ms, enabled)` — runs only while `!document.hidden`, listens to `visibilitychange`. Used by `Layout.jsx` (unread, 15 s) and `Conversation.jsx` (4 s).
- `Conversation.jsx`: `currentId` ref ignores answers for a conversation you've left; `pollError` vs `error` ([[Mistakes and Fixes#M22]]); `if (sending) return`.

## 6. Bug fixes
See the table in [[Mistakes and Fixes]] M24–M35; the main new helper is `saveFiles(dir, items)` in `lib/uploads.js` (check all → write all → `discard()` on failure).

## 7. Check
```
npm test        # 51 pass (incl. performance.test.js, review-fixes.test.js)
npm run build   # first-load JS ≈ 71 KB gzipped
```
To prove a new test really catches its bug: `git stash push -- server/src`, run the test (must FAIL), `git stash pop` (must PASS) — [[Mistakes and Fixes#M23]].
