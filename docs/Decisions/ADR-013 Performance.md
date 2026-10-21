---
tags: [decision, performance]
status: accepted
date: 2026-10-21
---
# ADR-013 Performance: measure first, then indexes, compression, caching, code-splitting

## Context
The owner asked to "fix and optimize the app". Rule we followed: **measure before changing anything**, and only optimise what the numbers show.

## How we measured
A throw-away script filled a database with **5,000 users, 30,000 requests, 20,000 conversations, 200,000 messages**, started the real app, and timed 200 calls to each busy endpoint, plus `EXPLAIN QUERY PLAN` for the main queries. Delivery to the browser was checked with `curl -D -` (headers) on the production build.

## Results
| Endpoint | Before | After | Note |
|---|---|---|---|
| Unread counter (every 15 s per user) | **25.3 ms** | **1.0–1.2 ms** | was reading all 200k messages |
| Inbox | 3.7 ms | 1.5 ms (no gzip) | was scanning all conversations |
| My requests | 5.6 ms | 1.4 ms | was scanning all requests |
| Browse / search / detail / chat poll | 1–4 ms | same | already fine |
| App JavaScript, first visit | 316 KB, uncompressed, re-checked every visit | **71 KB** (gzip), cached 1 year | |
| Pages users rarely open (admin, chat, forms) | in the main file | 13 small files loaded on demand | |

## Options considered and what we chose
| Problem | Options | Chosen | Why |
|---|---|---|---|
| Slow unread/inbox queries | Cache counts in memory; store an `unread_count` column; **indexes + rewrite `OR` as `UNION ALL`** | Indexes + rewrite | No extra state to keep in sync; 25× faster is plenty |
| Unread messages lookups | Full index on `read_at`; **partial index `WHERE read_at IS NULL`** | Partial | Only unread rows are in it, so it stays tiny as messages grow |
| Download size | Minify only (already done); **gzip**; Brotli | gzip (`compression` package) | Simple, every browser supports it. Costs ~1.5–2 ms server CPU per list response on our test machine; saves far more on mobile networks. Responses under 1 KB (e.g. chat polls) aren't compressed. Brotli possible later via a CDN. |
| Repeat downloads | ETags (default); **long cache for hashed files + `no-cache` HTML** | Long cache | Build file names contain a content hash, so a new version gets a new name |
| Bundle size | Remove React; preact; **lazy-load rarely used pages** | Lazy pages | No rewrite needed. React itself (~70 KB gz) is most of what remains |
| Wasted polling | WebSockets/SSE ([[ADR-007 Real-time updates]]); **pause polling when the tab is hidden** | Pause | One small hook (`usePolling` in `client/src/hooks.js`) |
| Write on every chat poll | **Check for unread first (cheap index read), write only if needed** | Check first | Polls no longer take the database write lock |
| Growing tables | **Hourly cleanup of expired sessions, codes, reset links** | Cleanup | `cleanupExpired()` in `db.js`, run from `index.js` |
| SQLite settings | **`synchronous=NORMAL` (safe with WAL), `busy_timeout=5000`** | Both | Faster writes; no "database is locked" when `npm run seed` runs alongside |

## Not done (not needed yet)
- Full-text search (SQLite FTS5) for the search box: `LIKE '%word%'` took ~2–3 ms on 30,000 requests. Revisit at ~500k requests.
- Batching listing photos into one query: fine at 20 per page.

## Guarded by tests
`server/test/performance.test.js`: unread numbers stay correct, polls with nothing unread don't write, hot queries keep using their indexes (fails if a future change brings back a full scan), cleanup only removes dead rows, gzip on, migrations end at version 3.
