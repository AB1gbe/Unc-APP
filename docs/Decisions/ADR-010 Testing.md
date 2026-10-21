---
tags: [decision, testing]
status: accepted
date: 2026-10-21
---
# ADR-010 Testing

## Options considered
| Option | Notes |
|---|---|
| Jest | Popular but needs extra config for ES modules |
| Vitest | Great, but another dependency for the server |
| **`node:test` (built-in) + supertest** ✅ | Zero config, ES modules work, fast. Tests call the real Express app with an in-memory database. |
| Cypress | Good E2E, heavier |
| **Playwright** ✅ (smoke test) | Drives real Chromium; also produced the screenshots in `attachments/` |

## What is tested (`server/test/`)
- `kyc.test.js` (10 tests): unverified users blocked from posting; email required before KYC; wrong-code limit; under-18 rejected; fake image rejected; duplicate ID blocked; business doc required; reject → resubmit → approve; KYC files admin-only; full ID never returned.
- `messaging.test.js` (11 tests): no direct-message endpoints exist; vendor contacts about a listing; no duplicate conversations; can't offer on own request; unverified vendors blocked; outsiders can't read/write; separate thread per vendor; closed request = read-only; only owner edits; reporting; bans.
- `e2e/smoke.mjs`: full browser journey with two users and an admin.

Run: `npm test` (API) · `npm run e2e` (browser, see [[Step 12 - End-to-end check]]).
