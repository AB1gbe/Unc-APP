---
tags: [build-guide, safety]
step: 42
---
# Step 42: Closing note and deal problems (session 34)

**What/why:** [[Privacy, Demand and Trust#5. Thank-you note to other sellers, and deal problems]], [[ADR-042 Closing note and deal problems]].

1. Migration 25:
   ```sql
   ALTER TABLE reports ADD COLUMN deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL;
   ALTER TABLE reports ADD COLUMN kind TEXT;
   CREATE INDEX idx_reports_deal ON reports(deal_id);
   ```
2. `server/src/lib/notify.js`: kinds `found-elsewhere` and `request-closed`, and `thankOtherSellers(db, listing, status)` (every conversation on the request without a deal).
   - Called in `routes/listings.js` `POST /:id/status` only when the request was open and now isn't.
   - Called in `lib/expiry.js` `runExpiry` when a request closes after 30 days.
3. `server/src/routes/ratings.js`: `DEAL_PROBLEMS` and `POST /deals/:id/problem` (`kind` + `details` 10–1000 characters; deal members only; 409 while I have an open one). It inserts a report with `conversation_id`, `deal_id` and `kind`.
4. `server/src/routes/conversations.js`: the deal view adds `myProblem` (`open`, `resolved` or null).
5. Client:
   - `Notifications.jsx`: wording + 🙏 icon;
   - `Conversation.jsx`: `DealProblem` under the deal banner;
   - `admin/AdminHome.jsx`: "Deal problem" + a badge for the kind.
6. Tests: `server/test/closing-problems.test.js`; `e2e/smoke.mjs` (the seller reports a payment problem).

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
