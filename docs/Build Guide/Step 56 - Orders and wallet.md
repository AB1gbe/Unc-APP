---
tags: [build-guide, payments]
step: 56
---
# Step 56: Orders and wallet (session 58)

**What/why:** [[Orders, Wallet, Invites and Video#1. Orders and the wallet]], [[ADR-056 Orders and wallet credit]].

1. Migration 35: table `wallet_entries` (`user_id`, `amount` in fils, `reason`, `ref`, `UNIQUE (user_id, reason, ref)`).
2. `server/src/lib/wallet.js`: `CREDIT_CURRENCY = 'BHD'`, `balanceOf()`, `addCredit()` (returns false if that reward was already given).
3. `server/src/routes/wallet.js` (mounted at `/api`):
   - `GET /wallet` → `{ currency, balance, entries }`;
   - `GET /orders` → `{ inProgress, completed }`, the stage worked out from the accepted price, the deal, the payment plan and the ratings.
4. Account deletion removes the member's wallet entries; "Download my data" includes them.
5. Client:
   - `pages/Orders.jsx` (tabs, `.tabs` / `.tab` CSS) and `pages/Wallet.jsx`;
   - `moneyExact()` in `api.js` (shows BD 1.500, not BD 2);
   - routes in `App.jsx`; links on `Account.jsx`;
   - Arabic: "Orders" is «صفقاتي», because «الطلبات» already means "requests".
6. Tests: `server/test/wallet-orders.test.js`; `e2e/smoke.mjs` opens Orders and the wallet, then returns the buyer to the chat ([[Mistakes and Fixes#M107]]); `e2e/devices.mjs` checks `/orders` and `/wallet`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
