---
tags: [build-guide, admin]
step: 44
---
# Step 44: Owner dashboard (session 37)

**What/why:** [[Your Data, Dashboard and Care#2. Owner dashboard]], [[ADR-044 Owner dashboard]].

1. No migration.
2. `server/src/lib/metrics.js`: `metrics(db, days)` returns `totals`, `daily` (one row per day, zeros included), `answeredShare`, `firstOfferHours` (median), `categories`, `areas` (by governorate, via `shared/areas.js`).
3. `server/src/routes/admin.js`: `GET /metrics?days=7|30|90` (anything else → 30).
4. Client: `client/src/pages/admin/Dashboard.jsx` (tiles, `DayBars`, `ListBars`, "Show as a table"), added at the top of `AdminHome.jsx`. CSS: `.stat-tiles`, `.day-bars`, `.bar-tip` (hidden with `display: none` until hover — see [[Mistakes and Fixes#M91]]), `.list-bars`.
5. `e2e/arabic.mjs`: wait for `table:visible` on the admin page ([[Mistakes and Fixes#M90]]).
6. Tests: `server/test/metrics.test.js`; `e2e/smoke.mjs` logs in as admin, switches to 7 days and hovers a bar.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
