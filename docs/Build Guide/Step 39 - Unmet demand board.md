---
tags: [build-guide, sellers]
step: 39
---
# Step 39: Unmet demand board (session 34)

**What/why:** [[Privacy, Demand and Trust#2. What people are asking for (unmet demand)]], [[ADR-039 Unmet demand board]].

1. No migration: the query uses the existing `idx_listings_status (status, created_at)` index (checked in `server/test/performance.test.js`).
2. `server/src/routes/demand.js`:
   - `topWords(titles)`: lower-case words of 3+ letters, minus filler words (English + Arabic), used in at least 2 titles; top 3;
   - `GET /` (verified members): open requests from the last 30 days (newest 5000), grouped by category;
   - each category gets `requests`, `waiting` (no conversation yet) and `words` (from waiting ones only); only categories with 2+ requests;
   - `?area=Capital` (a governorate key from `shared/areas.js`) narrows it.
3. Mount it in `server/src/app.js`: `app.use('/api/demand', demandRoutes(db));`
4. Client:
   - `client/src/pages/Demand.jsx`, route `/demand` in `App.jsx`;
   - links "📊 What people are asking for" on Browse and "📊 What people ask for" on Home;
   - CSS `.demand .chip`.
5. Arabic: plurals go in `ar.js` as objects (`{ one, two, few, other }`), never plain text ([[Mistakes and Fixes#M84]]).
6. Tests: `server/test/demand.test.js`; `e2e/smoke.mjs` adds a second furniture request and opens the page; `e2e/devices.mjs` checks `/demand`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
