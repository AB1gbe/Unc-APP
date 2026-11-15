---
tags: [feature]
date: 2026-11-15
---
# Phone Codes

Why: [[ADR-082 Phone code for casual sellers]].

## What members see
- On **Sell** or **Post what you need**, a person who isn't ID-checked sees "Confirm your mobile number".
  1. They type a Bahrain mobile number (`3xxx xxxx` or `66xx xxxx`; `+973`, spaces and Arabic digits are fine).
  2. They tap **Text me a code**.
  3. They type the 6-digit code and tap **Confirm**.
  4. The posting form appears.
- Choosing Housing or Jobs instead shows "Housing and job ads need an ID check".
- The ID-check page tells people they can **Skip for now** if they only sell their own things or are looking for something.
- On the ad and the profile, others see a blue **Phone-checked** badge and "Mobile number confirmed; no ID check". The number is never shown.

## How it works
| Part | Where |
|---|---|
| Who needs what to post | `shared/trust.js` `postNeeds()` (server and form) |
| Number format | `shared/trust.js` `normalizePhone()` → `+973XXXXXXXX` |
| Send a code | `POST /api/auth/phone` `{ phone }` (email + Terms needed; owner only for businesses) |
| Check the code | `POST /api/auth/phone/verify` `{ code }` → `{ user }` with `phoneVerified`, `phone` (masked) |
| Posting check | `assertCanPost()` in `server/src/middleware/auth.js`, used by `POST/PATCH /api/listings`, photos and budget |
| Sending texts | `server/src/lib/sms.js` (`console`, `memory`, `twilio`) |
| Database | migration 46: `users.phone`, `users.phone_verified_at` (unique number), `phone_codes` |
| Screen | `client/src/components/PhoneCheck.jsx`, `client/src/pages/NewListing.jsx` |
| Tests | `server/test/phone-codes.test.js`; browser: end of `e2e/smoke.mjs` |

## Limits
- Codes last 10 minutes.
- 5 wrong tries lock a code.
- At most 5 texts a day per member.
- One account per number.
- Deleting the account frees the number.

## Turning on real texts (owner)
- **Needed before a real launch.** Without it, a real site can't send codes and people must use the ID check. The test site shows the code on screen instead.
1. Make a Twilio account. Buy a number, or use an approved sender name that can text Bahrain.
2. In Cloudflare → Workers → `unc-app` → Settings → Variables and Secrets, add:
   - `SMS_TRANSPORT` = `twilio`;
   - `TWILIO_ACCOUNT_SID`;
   - `TWILIO_FROM` (the number or sender name);
   - secret `TWILIO_AUTH_TOKEN`.
3. Retry the build, or merge anything to `main`.
- Other providers (for example Unifonic, which is common in the Gulf) can be added to `sms.js` the same way.
