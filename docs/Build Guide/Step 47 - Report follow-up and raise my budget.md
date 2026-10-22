---
tags: [build-guide, trust]
step: 47
---
# Step 47: Report follow-up and raise my budget (session 37)

**What/why:** [[Your Data, Dashboard and Care#5. Report follow-up and raise my budget]], [[ADR-047 Report follow-up and raise my budget]].

1. Migration 28:
   ```sql
   ALTER TABLE reports ADD COLUMN outcome TEXT CHECK (outcome IN ('action', 'nothing'));
   ALTER TABLE listings ADD COLUMN budget_raised_at TEXT;
   ```
2. `server/src/lib/notify.js`: kinds `report-action`, `report-no-action`, `budget-raised`.
3. `server/src/routes/admin.js` `POST /reports/:id/resolve`: optional `outcome`; when given (and the report was open) the reporter is notified.
4. `server/src/routes/listings.js` `POST /:id/budget`: owner, open request, higher than now, once per 24 h; notifies viewers/savers who haven't offered, aren't blocked or away, and pass `contactBlocker`.
5. Client: `Notifications.jsx` wording; `admin/AdminHome.jsx` "✓ Took action" / "Nothing wrong"; `ListingDetail.jsx` `RaiseBudget`.
6. Tests: `server/test/report-budget.test.js`; `e2e/smoke.mjs` raises a budget and resolves the deal-problem report.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
