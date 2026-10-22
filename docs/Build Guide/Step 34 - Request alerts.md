---
tags: [build-guide, alerts]
step: 34
---
# Step 34: Request alerts (session 31)

**What/why:** [[Choosing, Alerts and Safety#2. Request alerts for sellers]], [[ADR-034 Request alerts]].

1. Migration 19:
   ```sql
   CREATE TABLE alerts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     q TEXT, category TEXT, city TEXT, min_budget INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));
   CREATE INDEX idx_alerts_user ON alerts(user_id);
   CREATE INDEX idx_alerts_category ON alerts(category);
   ```
2. `server/src/routes/alerts.js`, mounted with `app.use('/api/alerts', alertRoutes(db))`:
   - `GET /`, `POST /` (at least one field, at most 10), `DELETE /:id`;
   - `alertMatches(alert, listing)`;
   - `tellAlerts(db, buyer, listing, skip)`.
3. Wire it up:
   - `routes/favourites.js`: `tellFavourites` returns the set of members it told;
   - `routes/listings.js`: call `tellAlerts(..., told)` after it;
   - `lib/notify.js`: add `alert-match` to `KINDS`;
   - `lib/push.js`: add `TEXT['alert-match']`;
   - `lib/i18n.js`: the messages, the "up to N alerts" pattern, and field labels `q` and `minBudget`.
4. Client:
   - `pages/Alerts.jsx` with the route `/alerts` (`App.jsx`);
   - Browse link "🔔 Alert me about new requests like these" (query string pre-fills the form);
   - Account link;
   - `Notifications.jsx` wording.
5. Tests: `server/test/alerts.test.js` and the `idx_alerts_category` check in `performance.test.js`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
