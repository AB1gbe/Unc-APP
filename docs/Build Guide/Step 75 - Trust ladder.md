---
tags: [build-guide]
date: 2026-11-15
---
# Step 75 - Trust ladder

Why: [[ADR-080 Trust ladder]]. Folder `Unc-APP`, branch `claude/vibrant-edison-r9o798`. No database change.

## Server
- `server/src/middleware/auth.js`:
  - new `requireMember` (email + Terms);
  - `requireVerified` = member + ID check, and a card only for `account_type = 'business'`.
- `server/src/routes/conversations.js`:
  - `POST /api/listings/:id/contact` uses `requireMember`;
  - offers on `wanted` need the ID check (403 `KYC_REQUIRED`);
  - `NEW_CHATS_PER_DAY = 5` for members without the ID check (429);
  - sending messages, responding to offers and asking for a proof photo use `requireMember`.
- `server/src/lib/contact.js`: rule `verified` (ads: "Only ID-checked members").
- `server/src/routes/listings.js`: ads accept `contactRule: 'verified'`.
- `server/src/lib/referrals.js`, `server/src/routes/wallet.js`: "fully verified" = email + ID check (+ card for businesses).
- `server/src/lib/i18n.js`: Arabic for the 2 new messages.

## App
- `client/src/auth.jsx`: `canChat()`, new `isVerified()`.
- `client/src/components/ui.jsx`:
  - red "Not ID-checked" badge;
  - the card prompt only for businesses;
  - a Terms prompt.
- `client/src/pages/ListingDetail.jsx`:
  - the reply box needs only `canChat`;
  - an "ID-checked only" notice;
  - a hint to get ID-checked.
- `client/src/pages/NewListing.jsx`: "Who can message you?" on ads.
- `client/src/pages/Verification.jsx`, `VerifyEmail.jsx` (`Steps`), `Account.jsx`: the card is for businesses only.
- `client/src/locales/ar.js`.

## Tests
- `server/test/trust-ladder.test.js` (4; 3 fail on the old code).
- Updated `kyc`, `payment-card` and `referrals` tests.
- `e2e/smoke.mjs`: people skip the card; a new email-only member replies to the housing ad, and the advertiser sees "Not ID-checked".
- `e2e/arabic.mjs`: people skip the card.
