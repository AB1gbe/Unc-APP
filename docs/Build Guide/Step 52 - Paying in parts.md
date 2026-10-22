---
tags: [build-guide, payments]
step: 52
---
# Step 52: Paying in parts (session 40)

**What/why:** [[Deals, Terms, Cards and Installments#5. Paying in parts]], [[ADR-052 Paying in parts]].

1. Migration 33: tables `installment_plans` and `installment_parts` (+ indexes).
2. `server/src/lib/installments.js`: `splitAmount`, `dueDates` (end-of-month safe), `planView`, `runInstallmentReminders` (hourly + start-up in `index.js`).
3. `server/src/routes/installments.js` (mounted at `/api`):
   - `GET`/`POST /conversations/:id/plan` (needs an accepted price; one plan at a time);
   - `POST /plans/:id/respond`, `/cancel`, `/parts/:n/paid` (buyer), `/parts/:n/confirm` (seller).
4. `server/src/lib/notify.js`: kinds `plan-proposed`, `plan-accepted`, `plan-declined`, `part-paid`, `part-confirmed`, `part-due`, `part-late`.
5. Client: `components/PlanCard.jsx` in `Conversation.jsx` (after an accepted price); `Notifications.jsx` wording.
6. Tests: `server/test/installments.test.js`; `e2e/smoke.mjs` suggests 3 monthly parts, accepts, pays and confirms part 1.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
