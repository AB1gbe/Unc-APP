---
tags: [build-guide]
date: 2026-11-15
---
# Step 77 - Phone code for casual sellers

Why: [[ADR-082 Phone code for casual sellers]].
- Folder `Unc-APP`, branch `claude/vibrant-edison-r9o798`.
- Database: migration 46.

1. `server/src/db.js`: migration 46 adds `users.phone`, `users.phone_verified_at` (unique index) and the `phone_codes` table.
2. `shared/trust.js`: `postNeeds()`, `normalizePhone()`, `maskPhone()`.
3. `server/src/lib/sms.js` and `server/src/config.js`:
   - `config.sms` holds the transport, whether codes are enabled, and whether dev codes are shown;
   - `SMS_TRANSPORT` defaults to `console`; tests use `memory`.
4. `server/src/routes/auth.js`: `POST /api/auth/phone` and `POST /api/auth/phone/verify`.
5. `server/src/middleware/auth.js`: `assertCanPost()` and `publicMe` `phoneVerified`/`phone`.
   - `server/src/routes/listings.js`: posting, editing, photos and budget use `requireMember` plus `assertCanPost`; the listing's `buyer.idChecked` is filled in.
6. Other server files:
   - `server/src/routes/ratings.js`: profiles for phone-checked people (`idChecked: false`);
   - `server/src/app.js`: `/api/auth/phone` is owner only;
   - `server/src/lib/deletion.js`: deleting clears the number;
   - `server/src/lib/i18n.js`: Arabic for the new messages.
7. Client:
   - `PhoneCheck.jsx`;
   - `NewListing.jsx` shows the missing step;
   - `App.jsx` and `ui.jsx` add `RequireMember` and the `phone` badge;
   - `ListingDetail.jsx`, `MemberProfile.jsx`, `MyListings.jsx`, `Verification.jsx` (Skip for now), `Board.jsx`, `AdList.jsx`;
   - Arabic in `ar.js`;
   - CSS `.phone-check`.
8. Tests: `server/test/phone-codes.test.js` (9 tests; 7 fail on the old code). Browser: the casual seller journey at the end of `e2e/smoke.mjs`.

## Check (Windows cmd, in `Unc-APP`)
```
npm test
set VITE_ALL_FEATURES=1
npm start
```
- `npm test`: 234 pass.
- With the all-features build running, run `npm run e2e` in a second window.
- `npm start` rebuilds the pages, so set `VITE_ALL_FEATURES` before it: [[Mistakes and Fixes#M159]].
