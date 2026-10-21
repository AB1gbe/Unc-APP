---
tags: [build-guide, email]
step: 23
---
# Step 23: Email for new offers (session 17)

**What/why:** [[Email Sending#The new-offer email (session 17)]], [[ADR-023 Email for new offers]]. This needs no new packages: it uses the mailer from [[Step 13 - Real email sending]].

## 1. Database: migration 11 (add it to the end of `MIGRATIONS` in `server/src/db.js`)
```sql
ALTER TABLE users ADD COLUMN email_offers INTEGER NOT NULL DEFAULT 1;
```

## 2. Server
- `server/src/middleware/auth.js` `publicMe`: `emailOffers: u.email_offers !== 0`.
- `server/src/routes/auth.js` `PATCH /me`: accept `emailOffers`, but only a real `true`/`false` (anything else → 400). Save it as `email_offers = 1/0`.
- `server/src/lib/emails.js`:
  - `layout()` takes an optional footer.
  - `textDir(s)`: `rtl` if the first letter is Arabic, otherwise `ltr`.
  - `member(s)` = `<span dir=…>` and `iso(s)` = `⁨…⁩` (Unicode isolate marks).
  - `newOfferEmail({ sellerName, title, message, offerPrice, currency, conversationId }, language)` returns `{subject, text, html}` in `en` or `ar`, with a button to `APP_URL/messages/<id>` and a footer link to `APP_URL/account`.
- `server/src/routes/conversations.js`, contact route, after the transaction: read the buyer (`email, language, email_offers`), and if switched on, call `trySendMail({ to, ...newOfferEmail(...) })`. Don't `await` it.
- `server/src/lib/i18n.js`: Arabic for `emailOffers must be true or false.`

## 3. Client
- `client/src/pages/Account.jsx`: `EmailSettings` card with a tick box.
  - It keeps its own `checked` state, so the tick changes at once.
  - It calls `PATCH /api/auth/me { emailOffers }` and puts the tick back if saving fails ([[Mistakes and Fixes#M60]]).
- `client/src/styles.css`: `.toggle-row` (a 44 px tall row you can tap anywhere on).
- `client/src/locales/ar.js`: 3 new texts.

## 4. Check (inside `Unc-APP`)
```
npm test
npm run e2e
npm run e2e:ar
npm run e2e:devices
```
- `npm test`: 101 tests, including `server/test/offer-email.test.js` (4).
- `npm run e2e`: also unticks the box, reloads and checks that it stayed unticked.
- To see the email itself, run `npm run dev` without email set up. Make an offer as a seller, and the email is printed in the `[api]` window.
