---
tags: [build-guide, trust]
step: 49
---
# Step 49: Did you get it (session 40)

**What/why:** [[Deals, Terms, Cards and Installments#2. Did you get it]], [[ADR-049 Did you get it]].

1. Migration 30: `ALTER TABLE conversations ADD COLUMN got_it_asked_at TEXT;`
2. `server/src/lib/notify.js`: kind `did-you-get-it` and `askDidYouGetIt(db)` (accept older than 3 days, request still open, not asked yet).
3. `server/src/index.js`: run it at start-up and hourly.
4. `client/src/pages/Notifications.jsx`: wording + 🤔.
5. Tests: `server/test/did-you-get-it.test.js`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
