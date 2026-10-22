---
tags: [build-guide, payments]
step: 51
---
# Step 51: Payment card when joining (session 40)

**What/why:** [[Deals, Terms, Cards and Installments#4. Payment card when joining]], [[ADR-051 Payment card when joining]].

1. Migration 32: table `payment_cards` (one row per member: provider, provider_ref = the token, brand, last4, exp_month, exp_year) and `users.card_added_at`.
2. `server/src/lib/payments.js`: `PAYMENT_PROVIDER` (`config.paymentProvider`, default `test`). The `test` provider reads tokens `tok_test_<brand>_<last4>_<mm>_<yy>`, refuses expired cards and declines last 4 `0002`. The `tap` provider is a placeholder until a Tap account exists.
3. `server/src/routes/payments.js`: `GET /api/payments/card`, `POST /api/payments/card { token }` (sets `card_added_at`). Mounted at `/api/payments`.
4. `requireVerified` → 403 `CARD_REQUIRED` without a card; `publicMe.hasCard`; deleting an account removes the card row.
5. Client:
   - `client/src/cards.js` (Luhn check, brand, expiry, test token);
   - `pages/PaymentCard.jsx` (`/payment-card`);
   - a card step on `Verification.jsx` and a 5th step in `Steps`;
   - `VerifyPrompt` links to it;
   - Account → `CardSettings`;
   - `isVerified` in `auth.jsx` needs `hasCard`.
6. `seed.js` gives demo members a test card; the test helper adds one when approving a member.
7. `.env.example`: `PAYMENT_PROVIDER`, `TAP_SECRET_KEY`.
8. Tests: `server/test/payment-card.test.js` (and `kyc.test.js` now adds a card before posting). Both browser tests add a card (the smoke test tries a declined one first).

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
