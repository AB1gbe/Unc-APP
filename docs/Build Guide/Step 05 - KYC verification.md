---
tags: [build-guide, kyc]
step: 5
---
# Step 05 — KYC verification

**Files:** `server/src/lib/uploads.js`, `server/src/kyc/index.js`, `server/src/kyc/providers/manual.js`, `server/src/routes/kyc.js`. Full feature description: [[KYC Verification]]. Why manual first: [[ADR-005 KYC approach]].

## 5.1 Safe uploads (`lib/uploads.js`)
- Multer with **memory storage** so we can inspect bytes before writing anything to disk.
- `sniff(buffer)` compares the first bytes with known signatures:
  | Type | First bytes |
  |---|---|
  | JPG | `FF D8 FF` |
  | PNG | `89 50 4E 47` |
  | WEBP | `52 49 46 46` + `WEBP` at byte 8 |
  | PDF | `25 50 44 46` (`%PDF`) |
- `saveFile(file, dir, {allowPdf})` → rejects unknown types, writes `<random>.ext`.
- Limits: 5 MB per file.

## 5.2 Provider interface (`kyc/`)
- `providers/manual.js` → `{ name: 'manual', start() { return { status: 'pending' } } }`
- `index.js` → `getProvider()` picks by `KYC_PROVIDER`; `applyDecision(db, id, decision, note, reviewerId)` is the **only** code that changes KYC state (submission + user, in one transaction, audited).

## 5.3 Route (`routes/kyc.js`)
`POST /api/kyc` with `upload.fields([...docFront, docBack, selfie, businessDoc])`. Order of checks is listed in [[KYC Verification#What the server checks (in order)]].

Duplicate-ID detection:
```js
const idNumber = raw.replace(/[\s-]/g, '').toUpperCase();
const idHash = pepperedHash(`${country.toUpperCase()}|${idType}|${idNumber}`);
// any OTHER user with a pending/approved submission with this hash → 409
```

## 5.4 Admin side
In `routes/admin.js`: list queue, view details (hash removed), stream files via `sendKycFile()` (rejects `/`, `\`, `..` in names → no path traversal), decision endpoint requiring a note to reject.

## Check it
Covered by `server/test/kyc.test.js` (10 tests) — run `npm test`.

Next → [[Step 06 - Requests (listings)]]
