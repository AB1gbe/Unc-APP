---
tags: [build-guide, marketplace]
step: 68
---
# Step 68: Marketplace first (session 77)

**What/why:** [[ADR-068 Marketplace first]].

**Server**
1. `server/src/db.js`, migrations (append only):
   - **39:** `listings.item_condition` ('any' | 'new' | 'used', default 'any') and `listings.sample` (0/1);
   - **40:** `messages.offer_stock` ('in-stock' | 'order') and `messages.offer_delivery` ('pickup' | 'delivery' | 'both').
2. `server/src/routes/listings.js`:
   - `CONDITIONS`, `SORTS`;
   - `readListingBody` reads `condition`; insert and update save it; `listingView` returns `condition` and `sample`;
   - `GET /api/listings` takes `q` (title, description **and area**), `min`, `max` (budget overlap), `offers=with|none`, `condition=new|used`, `sort=newest|closing|offers`;
   - each listing gets `responders` (up to 3); the detail gets all, with `replyTime`. Name, type, avatar, area and rating only, **never prices**;
   - for a seller: `myOffer.status` = `sent` | `seen` | `accepted` | `declined` (from `read_at` and the accept/decline reply).
3. `server/src/lib/offers.js`: `STOCK`, `DELIVERY`; read and returned with the other details. `server/src/routes/conversations.js` saves and returns them.
4. `server/src/routes/feed.js`: live counters and the activity list skip `sample = 1`. `server/src/seed.js` marks all demo requests `sample = 1` and sets a few conditions.
5. Tests: `server/test/marketplace-list.test.js`, `server/test/offer-status.test.js`; `offer-details.test.js` expects `stock`/`delivery`.

**Website**
6. `client/src/components/ui.jsx`:
   - `ListingCard` (class `req-card`): photo + Sample tag, category · condition, title, budget, area, days left, `Responders` and one action ("See offers" / "Make an offer" / "View request");
   - also `conditionLabel`, `daysLeft`, `replyLabel`.
7. `client/src/pages/Browse.jsx`: "More filters" (budget from/to, offers, condition), Sort, result count, Clear all.
8. `client/src/pages/ListingDetail.jsx`:
   - big price and three facts (condition, offers, days left), sample note;
   - `WhoAnswered` (everyone but the buyer);
   - `ChoosingSteps` (buyer);
   - `OfferStatus` (seller).
9. `client/src/components/OfferDetails.jsx`: Stock and Pickup/delivery fields and labels. `client/src/pages/NewListing.jsx`: Condition.
10. `client/src/pages/Landing.jsx`: short line, search (category, area), 6 open requests, then `CategoryPreview` and `ShopsPreview`.
11. `client/src/styles.css`: blocks "Marketplace requests", "Phones … compact rows", "Request page with offers", "Visitors' home". Use `a.req-card` (not `.req-card`) to beat `a.card` ([[Mistakes and Fixes#M136]]).
12. Arabic in `client/src/locales/ar.js` (plural keys are the plural form, e.g. `'{n} days left'`).
13. `e2e/smoke.mjs`: `.searchbar > select`, and the phone home checks `.market-intro`.

Check: `npm test` (192), `npm run e2e`, `npm run e2e:ar`, `npm run seed` + `npm start` + `npm run e2e:devices`. Optional: `node scripts/make-screens-pdf.mjs`.
