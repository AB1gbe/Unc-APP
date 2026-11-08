---
tags: [build-guide, social]
step: 55
---
# Step 55: Live counters and "Closes in N days" (session 56)

**What/why:** [[Social Touches#8. Live counters and "Closes in N days" (session 56)]], [[ADR-055 Live counters and closing badge]].

1. Migration 34 in `server/src/db.js`:
   ```sql
   CREATE INDEX idx_listings_created ON listings(created_at);
   CREATE INDEX idx_users_last_seen ON users(last_seen_at);
   ```
2. `server/src/routes/feed.js`: `GET /pulse` → `{ requests, offers, active }` (last 24 h, last 24 h, last 15 minutes and not banned), cached for 60 s.
3. `server/src/routes/listings.js`: `BASE_SELECT` adds `closes_at` (`COALESCE(l.renewed_at, l.created_at)` + `LIFE_DAYS`); `listingView` returns `closesAt` for open requests.
4. Client:
   - `client/src/closing.js`: `closingDays(closesAt)` (null outside the last 3 days, 0 = today, else days rounded);
   - `ClosesBadge` in `components/ui.jsx`, used by `ListingCard` and `ListingDetail.jsx` (not for the owner);
   - `components/LivePulse.jsx` at the top of `Browse.jsx` and `Home.jsx`;
   - CSS `.live-pulse`, `.pulse-dot` (the dot doesn't pulse for people who turned off motion);
   - Arabic plurals in `ar.js`.
5. `server/src/seed.js`: the wardrobe request is made 28 days old so the badge shows.
6. Tests: `server/test/pulse-closing.test.js`; index checks in `server/test/performance.test.js`; `e2e/smoke.mjs` reloads Browse until the counters show (they're cached for a minute).

Check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
