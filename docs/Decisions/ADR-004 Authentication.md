---
tags: [decision, security]
status: accepted
date: 2026-10-21
---
# ADR-004 Authentication: server sessions in an httpOnly cookie

## Options considered
| Option | Pros | Cons |
|---|---|---|
| JWT in localStorage | Stateless | Readable by any injected script (XSS steals it); can't instantly log out / ban a user |
| JWT in cookie | Better | Still can't revoke without a deny-list → you end up with sessions anyway |
| Auth0 / Clerk / Firebase Auth | Hosted, social login | Monthly cost, vendor lock-in, harder to replicate offline |
| Passport.js | Many strategies | Unneeded abstraction for email + password |
| **Random session token in httpOnly cookie, hash stored in DB** ✅ | Simple, revocable (ban = delete sessions), invisible to page scripts | One DB lookup per request (cheap with SQLite) |

## Decision details (`server/src/routes/auth.js`, `server/src/middleware/auth.js`)
- Token: 32 random bytes (`crypto.randomBytes`), sent as cookie `unc_session`.
- Database stores only **SHA-256 of the token** → a leaked DB can't be used to log in.
- Cookie flags: `httpOnly`, `sameSite=lax` (CSRF protection), `secure` in production, 14-day expiry.
- Passwords: **scrypt** with random 16-byte salt, compared with `timingSafeEqual`. Built into Node → no native bcrypt module ([[ADR-003 Database]] explains why we avoid native modules).
- Password rule: ≥ 8 chars with letters and numbers.
- Login error is the same for "no such email" and "wrong password" (no account enumeration).
- Rate limit: 20 attempts / 15 min per IP on register, login, verify-email, resend-code.
- Banning a user deletes all their sessions → logged out instantly.
