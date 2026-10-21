---
tags: [build-guide, social]
step: 31
---
# Step 31: "Happening near you" feed (session 26)

**What/why:** [[Social Touches#6. "Happening near you" (session 26)]], [[ADR-031 Happening near you]].

1. Migration 17 (add it to the end of `MIGRATIONS` in `server/src/db.js`):
   ```sql
   CREATE INDEX idx_deals_created ON deals(created_at);
   CREATE INDEX idx_conversations_created ON conversations(created_at);
   CREATE INDEX idx_users_new_shops ON users(created_at) WHERE account_type = 'business';
   ```
2. `server/src/routes/feed.js`, mounted with `app.use('/api/feed', feedRoutes(db))`. Four queries, each over the last 7 days:
   - **found:** `deals` joined to `listings`; returns **only** the city and category; leaves out banned buyers and sellers.
   - **request:** open listings, leaving out banned buyers and the viewer's own requests (`l.buyer_id <> ?`). Don't filter with one query per item ([[Mistakes and Fixes#M76]]).
   - **shop:** business accounts that are approved and not banned.
   - **offers-today:** a count of conversations created in the last 24 h on listings in the viewer's city; shown from 2.

   Then mark `near` (the viewer's city is in the item's city, ignoring case), sort near-first and then newest, and return 8.
3. `client/src/components/Feed.jsx`:
   - `line(item)` turns each `kind` into translated text, with links to the request or the shop;
   - put it on `Home.jsx` after "Your open requests";
   - put it on `Browse.jsx` for visitors, with the title "Happening on Unc".
4. Add Arabic for the 7 new texts in `client/src/locales/ar.js`; CSS `.feed` goes in `styles.css`.
5. Tests:
   - `server/test/feed.test.js` (2): anonymity, city first, the offers count, and the left-out cases;
   - index checks in `performance.test.js`;
   - `e2e/smoke.mjs` checks the anonymous find on Home and the visitor feed.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
