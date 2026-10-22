---
tags: [build-guide, privacy]
step: 38
---
# Step 38: Who may contact me and first name only (session 34)

**What/why:** [[Privacy, Demand and Trust#1. Who may contact me + show only my first name]], [[ADR-038 Who may contact me and first name only]].

1. Migration 22 in `server/src/db.js`:
   ```sql
   ALTER TABLE users ADD COLUMN short_name INTEGER NOT NULL DEFAULT 0;
   ALTER TABLE listings ADD COLUMN contact_rule TEXT NOT NULL DEFAULT 'anyone';
   ```
2. `shared/names.js`: `shortName("Sam Buyer")` → `"Sam B."`, and `nameFor(name, short)`.
3. `server/src/lib/contact.js`:
   - `CONTACT_RULES` = anyone, shops, rated, favourites;
   - `contactBlocker(db, listing, seller)` returns the rule that stops this seller, or null;
   - `isWellRated` (at least 1 visible rating, average ≥ 4);
   - `CONTACT_ALLOWED_SQL` + `contactAllowedParams(db, me)` for lists;
   - `CONTACT_MESSAGES` (with Arabic in `server/src/lib/i18n.js`).
4. Server routes:
   - `routes/listings.js`: `contactRule` in `readListingBody`, INSERT and UPDATE; `contactRule` in `listingView`; `contactBlocked` in the detail view; `CONTACT_ALLOWED_SQL` in for-you;
   - `routes/conversations.js`: contact → 403 with the rule's message;
   - `routes/favourites.js` and `routes/alerts.js`: skip sellers with a `contactBlocker`;
   - `routes/auth.js` `PATCH /me`: `shortName` (boolean; 400 for business accounts); `middleware/auth.js` `publicMe`: `shortName`.
5. Names: wherever another member's name is returned, select `short_name` too and pass it through `nameFor()`. That is `listings.js`, `conversations.js`, `ratings.js`, `stories.js`, `notifications.js`, `favourites.js` and `blocks.js`. In conversations the buyer's flag is `b.short_name AND NOT EXISTS (a message from the buyer in this chat)`. On a profile, the member themself sees the full name.
6. Client:
   - `NewListing.jsx`: the "Who can make offers?" select (`#contactRule`);
   - `components/ui.jsx`: `ContactRule` badge on cards and the request page;
   - `ListingDetail.jsx`: a "The buyer chose…" card instead of the offer form;
   - `Account.jsx`: a `ToggleSetting field="shortName"` (personal accounts).
7. Tests: `server/test/privacy-contact.test.js`. `e2e/smoke.mjs` turns on first-name-only, posts a favourites-only request and checks the seller sees "Sam B." and the notice.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
