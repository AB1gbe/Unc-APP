---
tags: [build-guide, sellers]
step: 45
---
# Step 45: Away mode (session 37)

**What/why:** [[Your Data, Dashboard and Care#3. Away mode]], [[ADR-045 Away mode]].

1. Migration 27:
   ```sql
   ALTER TABLE users ADD COLUMN away_until TEXT;
   CREATE TABLE away_periods (id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL);
   CREATE INDEX idx_away_user ON away_periods(user_id, ends_at);
   ```
2. `server/src/lib/activity.js`:
   - `setAway(db, userId, until)` ends any current period, starts a new one (until the end of that day) and sets `users.away_until`;
   - `NOT_AWAY` (SQL);
   - the reply-time query skips messages that arrived during an away period;
   - `summaryFor` adds `awayUntil`.
3. `PATCH /api/auth/me` accepts `awayUntil` (today to 60 days ahead, or `null`); `publicMe` adds `awayUntil`.
4. `routes/alerts.js` and `routes/favourites.js` add `${NOT_AWAY}`; `compareFor` adds `awayUntil`.
5. Client: `Activity` in `components/ui.jsx` shows "🌴 Away until …"; `Account.jsx` → `AwayMode`; `CompareOffers.jsx`.
6. Tests: `server/test/away-mode.test.js`; `e2e/smoke.mjs` (the shop goes away, the buyer sees it in the chat, the shop comes back).

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
