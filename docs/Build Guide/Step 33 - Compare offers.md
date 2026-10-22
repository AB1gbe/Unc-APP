---
tags: [build-guide, offers]
step: 33
---
# Step 33: Compare offers (session 31)

**What/why:** [[Choosing, Alerts and Safety#1. Compare offers side by side]], [[ADR-033 Compare offers]].

1. `server/src/routes/conversations.js`: prepared queries for:
   - the seller's latest price;
   - the agreed price (an `accept` message joined to the price it answers);
   - the seller's first message and first photo;
   - unread messages.

   `compareFor(convId)` returns `{price, agreedPrice, firstMessage (≤140), photoUrl, replyTime, badges, unread}`. Add it as `compare` to every item in `GET /listings/:id/conversations`, which only the buyer can call.
2. `client/src/components/CompareOffers.jsx`:
   - sort by price, rating or reply time;
   - "Lowest" on the cheapest offer, "Agreed" after an accept;
   - the cards link to each chat.
   - Render it in `ListingDetail.jsx` under the two columns, owner only. It shows itself from 2 offers.
3. Add CSS `.compare*` and Arabic texts.
4. `server/src/seed.js`: the demo PS5 request gets 2 offers. `e2e/devices.mjs` opens the request with the most offers.
5. Test: `server/test/compare-offers.test.js`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
