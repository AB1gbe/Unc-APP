---
tags: [build-guide, testing]
step: 9
---
# Step 09 — Automated API tests

**Files:** `server/test/helpers.js`, `kyc.test.js`, `messaging.test.js`. Why this setup: [[ADR-010 Testing]].

## helpers.js — the trick
Environment variables must be set **before** the app's modules load (they read config at import time). So helpers.js sets `process.env.NODE_ENV='test'`, a temp `DATA_DIR`, admin credentials, and **then** uses `await import(...)` for the app. (Setting `NODE_ENV=test` in the npm script would break on Windows — [[Mistakes and Fixes#M1]].)

`setup()` returns:
- `admin` — logged-in supertest agent (keeps cookies),
- `user(stage, accountType)` — makes a user at `'registered' | 'email' | 'pending' | 'approved'` by calling the real API (register → verify with `devCode` → KYC upload of a tiny fake PNG → admin approves),
- `kyc(agent, overrides)`, `listing(agent, overrides)`.

## Run
```bash
npm test
# tests 21 · pass 21 · fail 0
```
> Two wrong turns on the test command: [[Mistakes and Fixes#M2]], [[Mistakes and Fixes#M3]].

Next → [[Step 10 - Client setup]]
