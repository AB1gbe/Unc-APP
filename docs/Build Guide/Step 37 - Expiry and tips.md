---
tags: [build-guide, requests]
step: 37
---
# Step 37: Expiry and tips (session 31)

**What/why:** [[Choosing, Alerts and Safety#5. "Still looking?" expiry and tips]], [[ADR-037 Expiry and tips]].

1. Migration 21:
   ```sql
   ALTER TABLE listings ADD COLUMN renewed_at TEXT;
   ALTER TABLE listings ADD COLUMN expiry_reminded_at TEXT;
   ALTER TABLE listings ADD COLUMN expired_at TEXT;
   ```
2. `server/src/lib/expiry.js`:
   - `LIFE_DAYS = 30`, `REMIND_DAYS = 3`, `EXPIRES_AT_SQL`;
   - `runExpiry(db)` sends the reminder once (notify and push `expiring`), then closes the request (`expired_at`, notify `expired`).
   - Call it at start-up and hourly in `server/src/index.js`, next to `cleanupExpired`.
3. `server/src/routes/listings.js`:
   - `POST /:id/renew` (owner, open only, else 409);
   - `/status` → `open` resets `renewed_at`, `expiry_reminded_at` and `expired_at`;
   - the owner's detail view adds `expiresAt` and `expiredAt`.
4. Client:
   - `client/src/tips.js` `requestTips(listing, {offers, views, now})` returns up to 2 of `photo`, `details`, `budget`, `quiet`, `share`;
   - `ListingDetail.jsx` gets `ExpiryLine` (the button shows in the last 7 days) and `Tips`;
   - `Notifications.jsx` wording for `expiring` and `expired`.
5. Test: `server/test/expiry-tips.test.js`. To try expiry by hand without waiting, see that test: it moves `created_at` back in time and calls `runExpiry(db)`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
