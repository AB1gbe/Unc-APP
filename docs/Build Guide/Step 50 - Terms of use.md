---
tags: [build-guide, legal]
step: 50
---
# Step 50: Terms of use (session 40)

**What/why:** [[Deals, Terms, Cards and Installments#3. Terms of use]], [[ADR-050 Terms of use]].

1. Migration 31: `users.terms_version INTEGER NOT NULL DEFAULT 0`, `users.terms_accepted_at TEXT`.
2. `server/src/lib/terms.js`: `TERMS_VERSION` and `termsAccepted(user)`.
3. `server/src/routes/auth.js`: register needs `acceptTerms: true`; `POST /api/auth/terms { accept: true }`. `publicMe` adds `termsAccepted`. `middleware/auth.js` `requireVerified` → 403 `TERMS_REQUIRED`. `seed.js` and the test helper accept the Terms.
4. Client:
   - `pages/Terms.jsx` (`/terms`; every paragraph through `t()` with Arabic);
   - `components/TermsAccept.jsx` (banner in `Layout.jsx`);
   - the tick box in `Register.jsx` (`#acceptTerms`);
   - the reminder under Accept in `Conversation.jsx`;
   - a link on the Account page.
5. Tests: `server/test/terms.test.js`; both browser tests tick `#acceptTerms`; `e2e/devices.mjs` checks `/terms`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
