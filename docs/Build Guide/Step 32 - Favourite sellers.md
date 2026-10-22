---
tags: [build-guide, social]
step: 32
---
# Step 32: Favourite sellers (session 28)

**What/why:** [[Social Touches#7. Favourite sellers (session 28)]], [[ADR-032 Favourite sellers]].

1. Migration 18 (add it to the end of `MIGRATIONS` in `server/src/db.js`):
   ```sql
   CREATE TABLE favourites (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, seller_id));
   CREATE INDEX idx_favourites_seller ON favourites(seller_id);
   ```
2. `server/src/routes/favourites.js`, mounted with `app.use('/api', favouriteRoutes(db))`:
   - `PUT` and `DELETE /members/:id/favourite`;
   - `GET /favourites`;
   - `tellFavourites(db, buyer, listing)` sends a `notify(..., 'favourite-request', { actorId, listingId })` and a `pushTo(..., 'favourite-request', ...)` to each matching seller.
3. Hook it up:
   - `server/src/lib/notify.js`: add `'favourite-request'` to `KINDS`;
   - `server/src/lib/push.js`: add `TEXT['favourite-request']` in English and Arabic;
   - `server/src/routes/listings.js`: call `tellFavourites(...)` after a request is created;
   - `server/src/routes/ratings.js`: add `favouriteCount` and `favourite` to the profile;
   - `server/src/routes/conversations.js`: add `otherFavourite`.
4. Client:
   - `components/FavouriteButton.jsx`, on `MemberProfile.jsx` (not your own) and in the `DealBanner` of `Conversation.jsx` (buyers only);
   - `Notifications.jsx`: the `favourite-request` wording, linking to the request;
   - `Saved.jsx`: the `FavouriteSellers` list;
   - Arabic texts, including a plural for the count.
5. Tests:
   - `server/test/favourites.test.js` (3);
   - index checks in `performance.test.js`;
   - `e2e/smoke.mjs`: the buyer favourites the seller from the deal box and posts an Electronics request. The seller sees the notification, and the Saved page lists the seller. Return each browser to its chat page afterwards ([[Mistakes and Fixes#M77]]).

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
