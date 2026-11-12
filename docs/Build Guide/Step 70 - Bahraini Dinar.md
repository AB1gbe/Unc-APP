---
tags: [build-guide]
date: 2026-11-12
---
# Step 70 - Bahraini Dinar

Why: Unc is for Bahrain, so every price is in dinar. See [[ADR-070 Bahraini Dinar only]].

Folder: `Unc-APP` (top folder), branch `claude/vibrant-edison-r9o798`.

## 1. One formatter for everything
New file `shared/money.js`:
- `CURRENCY = 'BHD'`;
- `formatMoney(n, { lang, currency, exact })` → `BD 120`, `BD 1,250`, Arabic `120 د.ب`; `exact: true` or a non-whole number → 3 decimals (`BD 1.500`).

Used by:
- `client/src/api.js`: `money()` and `moneyExact()` now call `formatMoney`; new `currencyName()` = "BD" / "د.ب" for labels;
- `server/src/lib/previews.js` (link previews) and `server/src/lib/emails.js` (offer emails).

## 2. Only BHD accepted
- `server/src/lib/categories.js`: `CURRENCIES = ['BHD']` (any other value → 400).
- `server/src/routes/listings.js`: default currency `'BHD'`.
- `client/src/hooks.js`: meta default `currencies: ['BHD']`.
- `client/src/pages/NewListing.jsx`: no currency picker; the label reads "Budget in BD" (Arabic: `'Budget in {currency}'` in `client/src/locales/ar.js`).
- `client/src/pages/ListingDetail.jsx`: "Your price (BD)" and "New top budget (BD)".

## 3. Convert old prices (migration 41)
`server/src/db.js`:
- `export const TO_BHD_SQL` converts offer prices, payment-plan parts and totals, and request budgets that are not BHD, then sets the currency to BHD. Rates: USD 0.376, EUR 0.43, GBP 0.50, CAD 0.27, AUD 0.25. Amounts of BD 50+ round to BD 5; anything above 0 becomes at least BD 1.
- `MIGRATIONS` entry 41 is `TO_BHD_SQL`. Running it twice changes nothing.
- `server/src/seed.js` runs `db.exec(TO_BHD_SQL)` after adding the demo requests, so the demo shows realistic dinar prices.

## 4. Tests
- New `server/test/bahraini-dinar.test.js`: the format, a USD request refused, a USD listing and offer converted (300–1000 USD → BD 115–375; a 20 USD offer → BD 8).
- `offer-email.test.js` and `previews.test.js` expect `BD 35` / `BD 20 – BD 60`.
- `e2e/smoke.mjs`: the controller request is in BHD; it checks `BD 30 – BD 80`.

## Check it (Windows cmd, top folder)
```
npm test
npm run seed
npm start
```
Open http://localhost:5173 (or the port shown): every price reads "BD …"; switch to Arabic: "… د.ب".

On the Cloudflare test site, migration 41 runs by itself on the first start after the merge and converts the old demo prices.
