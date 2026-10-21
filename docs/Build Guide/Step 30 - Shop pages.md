---
tags: [build-guide, shops]
step: 30
---
# Step 30: Shop pages (session 24)

**What/why:** [[Shop Pages]], [[ADR-030 Shop pages]].

1. Migration 16 (add it to the end of `MIGRATIONS` in `server/src/db.js`):
   ```sql
   ALTER TABLE users ADD COLUMN cover TEXT;
   ALTER TABLE users ADD COLUMN shop_area TEXT;
   ALTER TABLE users ADD COLUMN shop_hours TEXT;
   ```
2. `server/src/lib/uploads.js`: `COVER_DIR()` (`uploads/covers`, public) and `coverUrl()`. `app.js` serves `/uploads/covers` like the avatars.
3. `server/src/lib/contact-guard.js`: `hasContactDetails(text)` checks for:
   - 7 or more digits (Western or Arabic) with any separators;
   - links: `http`, `www.`, `wa.me`, `t.me`, common domain endings;
   - email addresses;
   - `@handles`.

   `CONTACT_MESSAGE` holds the error text.
4. `server/src/lib/shop-hours.js`: `readShopHours(value)` accepts `null`, or exactly 7 entries, each `null` or `{open, close}` in "HH:MM", with open ≠ close.
5. `server/src/routes/auth.js`:
   - `PATCH /me`: run the guard on `bio`; accept `shopArea` (≤80, guarded) and `shopHours` from business accounts only (400 otherwise).
   - `POST /cover` and `DELETE /cover`, written like `/avatar`, business accounts only.
6. `server/src/middleware/auth.js`: `shopFields(u)` → `{coverUrl, shopArea, shopHours}` for business accounts. It is spread into `publicMe` and into `GET /api/members/:id` (`server/src/routes/ratings.js`).
7. `server/src/lib/i18n.js`: Arabic for the 3 new messages, and field labels for `cover`, `shopArea` and `shopHours`.
8. `server/src/seed.js`: the demo shop gets an area and hours (closed Fridays).
9. Client:
   - `client/src/hours.js` `openState(hours, date)`: plain JS, tested from the server tests.
   - `client/src/components/ShopHours.jsx`: `OpenNow`, the hours table, and `dayName(d)` (via `formatDate`, so it is translated).
   - `client/src/components/ShopEditor.jsx` on `Account.jsx`, for business accounts.
   - `MemberProfile.jsx`: cover, area + "Map ↗", OpenNow, and the hours card. On phones the header wraps (`.profile-head`, `.profile-rating`).
   - Arabic texts in `client/src/locales/ar.js`; CSS at the end of `styles.css` ("Shop pages").
10. Tests:
    - `server/test/helpers.js`: `t.user('approved', 'business')` now works. It sends the business name and number, and `kyc(agent, overrides, { businessDoc: true })` attaches the business document.
    - `server/test/shop.test.js`;
    - `e2e/smoke.mjs` (shop set-up and shop page);
    - `e2e/devices.mjs` (the demo shop page).

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
