---
tags: [build-guide, growth]
step: 57
---
# Step 57: Refer a friend (session 58)

**What/why:** [[Orders, Wallet, Invites and Video#2. Refer a friend]], [[ADR-057 Refer a friend]].

1. Migration 36: `users.referral_code` (unique index) and `users.referred_by`.
2. `server/src/lib/referrals.js`: `REFERRAL_REWARD = 1000`, `WELCOME_CREDIT = 500`, `referralCodeOf()` (8 letters, made on first use), `inviterByCode()`, `rewardReferral()` (only when email + identity + card are done; once).
3. Call `rewardReferral()` where verification can finish: `server/src/kyc/index.js` (on approval) and `server/src/routes/payments.js` (after a card is saved). Notification kind `referral-reward`.
4. `server/src/routes/auth.js`: register accepts `ref` (unknown codes are ignored). `server/src/routes/wallet.js`: `GET /referrals` → code, link, joined, verified, earned, reward, welcome, currency.
5. Client:
   - `pages/Invite.jsx` (`/invite`), with Copy / Share; the link is built from `window.location.origin`;
   - the sign-up note in `Register.jsx` (reads `?ref=`);
   - links on Account and the wallet;
   - the notification text.
6. Tests: `server/test/referrals.test.js`; `e2e/smoke.mjs` checks the invite link and the friend's sign-up note; `e2e/devices.mjs` checks `/invite`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
