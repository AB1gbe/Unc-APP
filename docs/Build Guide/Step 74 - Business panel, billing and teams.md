---
tags: [build-guide]
date: 2026-11-13
---
# Step 74 - Business panel, billing and teams

Why: [[ADR-077 Business accounts, paying for ads and teams]]. Folder `Unc-APP`, branch `claude/vibrant-edison-r9o798`.

## 1. CR number
`server/src/routes/kyc.js`:
- checks `businessRegNumber` with `/^\d{1,7}(-\d{1,4})?$/` after removing spaces and turning `/` into `-`;
- adds `-1` when there is no branch;
- refuses a CR already pending or approved for another account (409).

`client/src/pages/Verification.jsx` labels: "CR number (Commercial Registration)", "CR certificate (from Sijilat)".

## 2. Database: migration 44 (`server/src/db.js`)
- `ad_credit`: + pack / − ad, in fils.
- `ad_payments`: receipts.
- `listings.paid_fils`, `listings.posted_by`.
- `team_members`, `team_invites`.
- `sessions.actor_id`.

## 3. Server
- `lib/billing.js`: `AD_PRICES`, `PACKS`, `payForAd()` (before saving), `settleAd()` (inside the listing's transaction), `buyPack()`, receipts.
- `lib/payments.js`: `charge(card, amount)` (test provider: cards ending 0341 are declined at payment).
- `lib/sessions.js`: `startSession(db, res, userId, actorId)`.
- `middleware/auth.js`: `req.actorId`; `publicMe().actor`.
- `routes/business.js`:
  - `/api/business/dashboard|ads|billing|billing/packs|billing/receipts/:id|team…`;
  - `/api/team`, `/api/team/invites/:id/accept|decline`, `/api/team/switch/:id`, `/api/team/switch-back`, `DELETE /api/team/:businessId`.
- `app.js`: `OWNER_ONLY` paths refused for team members.
- `routes/listings.js`: payment on `POST /api/listings`, response `paid: {amount, from}`.
- `lib/emails.js`: `teamInviteEmail`.
- `lib/notify.js`: kind `team-invite`.
- `lib/i18n.js`: Arabic for the new errors.

## 4. App
- `pages/Business.jsx`: tabs and `Receipt`.
- `pages/Team.jsx`.
- `App.jsx` routes: `/business`, `/business/receipts/:id`, `/team`.
- `SideNav.jsx`, `Home.jsx`, `Account.jsx`: links.
- `Layout.jsx`: `ActingBanner`.
- `NewListing.jsx`: price notice.
- `styles.css`: "Business panel and teams" block, print rules.
- `locales/ar.js`.

## 5. Tests
- `server/test/business.test.js` (6) and `server/test/kyc.test.js` (CR).
- `e2e/smoke.mjs`: buy a pack, post a paid job, open the receipt and the dashboard.
- `e2e/devices.mjs`: `/team`.

## Check it (Windows cmd)
```
npm test
npm run seed
npm start
```
Log in as `vendor@demo.local` / `Password123` → **Business panel** → Billing → buy a pack → Post an ad (the form shows the price) → Billing shows the receipt.
