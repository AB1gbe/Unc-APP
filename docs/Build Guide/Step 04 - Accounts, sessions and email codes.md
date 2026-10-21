---
tags: [build-guide]
step: 4
---
# Step 04 — Accounts, sessions and email codes

**Files:** `server/src/middleware/auth.js`, `server/src/routes/auth.js`, `server/src/lib/mailer.js`, `server/src/seed.js`. Design reasons: [[ADR-004 Authentication]].

## middleware/auth.js
- `loadUser(db)` runs on **every** request: reads cookie `unc_session`, hashes it, joins `sessions`→`users` where not expired, sets `req.user` (or `null`).
- Gates: `requireAuth`, `requireVerified` (adds email + `kyc_status==='approved'`, returns `code: EMAIL_UNVERIFIED` / `KYC_REQUIRED` so the UI can explain), `requireAdmin`.
- `publicMe(user)` — the only user fields ever sent to the browser.

## routes/auth.js
| Endpoint | What happens |
|---|---|
| register | validate → 409 if email exists → scrypt hash → insert → issue email code → start session → return `devCode` in dev |
| login | same error for unknown email or bad password; banned → 403 |
| verify-email | code expired? ≥5 attempts → 429; wrong → attempts+1; right → set `email_verified_at` |
| resend-code | new code, attempts reset |
| logout | delete session row + clear cookie |

`startSession()` sets the cookie: `httpOnly`, `sameSite: 'lax'`, `secure` in production, 14 days.
Rate limiter: 20 requests / 15 minutes on sensitive endpoints (disabled in tests).

## seed.js
- `ensureAdmin(db)` — creates the admin from env vars if missing; called on every start.
- `npm run seed` additionally creates 3 verified demo users and 3 demo requests.

## Check it
```bash
curl -i -X POST localhost:4000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"a@b.co","password":"Password1","displayName":"Ann","accountType":"individual"}'
# → 201, Set-Cookie: unc_session=..., "devCode":"123456"
```

Next → [[Step 05 - KYC verification]]
