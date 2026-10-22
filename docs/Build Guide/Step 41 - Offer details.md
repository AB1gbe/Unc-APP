---
tags: [build-guide, choosing]
step: 41
---
# Step 41: Offer details (session 34)

**What/why:** [[Privacy, Demand and Trust#4. Offer details: condition, warranty, returns, valid until]], [[ADR-041 Offer details]].

1. Migration 24:
   ```sql
   ALTER TABLE messages ADD COLUMN offer_condition TEXT;
   ALTER TABLE messages ADD COLUMN offer_warranty TEXT;
   ALTER TABLE messages ADD COLUMN offer_returns TEXT;
   ALTER TABLE messages ADD COLUMN offer_valid_until TEXT;
   ```
2. `server/src/lib/offers.js`:
   - the allowed values (`CONDITIONS`, `WARRANTIES`, `RETURNS`);
   - `readOfferDetails(body, { isSeller, hasPrice })`: 400 if a buyer or a message without a price sends them; the date must be today to 60 days ahead;
   - `offerDetailsView(m)` and `isExpired(m)`.
3. `server/src/routes/conversations.js`: contact and messages pass the details to `insertMessage`; `messageView` and `compareFor` return `details`; `respond` refuses `accept` on an expired price (409).
4. Field names and messages in `server/src/lib/i18n.js` (FIELDS + AR).
5. Client:
   - `client/src/components/OfferDetails.jsx`: `OfferDetailFields`, `addDetails`, `OfferDetailsLine`;
   - used in `ListingDetail.jsx` (offer form, shown once a price is typed), `Conversation.jsx` (seller's price box; `OfferCard` hides Accept when expired) and `CompareOffers.jsx`.
6. `server/src/seed.js`: the two demo PS5 offers get details.
7. Tests: `server/test/offer-details.test.js`; `e2e/smoke.mjs` fills condition, warranty and returns and checks the badges.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
