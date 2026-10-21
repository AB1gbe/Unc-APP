---
tags: [feature, auth, security]
---
# Password Reset

**Why this design:** [[ADR-012 Password reset design]].
**Where:** `server/src/routes/auth.js` (`/forgot-password`, `/reset-password/check`, `/reset-password`, `/change-password`), `server/src/db.js` (migration 2: `password_resets`), `client/src/pages/ForgotPassword.jsx`, `ResetPassword.jsx`, `Account.jsx` (`ChangePassword`), `Login.jsx` (link + notice).

## Forgot password (logged out)
```
Login page ─ "Forgot password?" ─▶ enter email ─▶ "If an account exists… a link is on its way"
                                                  │ (same answer for unknown emails)
                                                  ▼
               email: "Choose a new password" ─▶ /reset-password?token=…
                                                  │ page checks the link first
                                                  ▼
                       new password ×2 ─▶ saved ─▶ all devices logged out ─▶ login page
                                                  └▶ email: "Your password was changed"
```
| | |
|---|---|
| ![[15-login-forgot-link.png]] | ![[16-forgot-sent.png]] |
| ![[17-reset-form.png]] | ![[19-reset-link-used.png]] |

## Rules
| Rule | How |
|---|---|
| Link valid **30 minutes**, **once** | `expires_at`, `used_at` in `password_resets` |
| Only the **newest** link works | Requesting a new one deletes older ones |
| Database never holds a usable token | Only `SHA-256(token)` stored; token is 32 random bytes |
| Can't discover who's a member | Same response for any email; email sent without waiting so timing is the same |
| Whoever had the old password is kicked out | All sessions deleted on reset |
| Owner is warned | "Password changed" email with a link to reset again |
| Banned accounts can't reset | Silently ignored |
| Brute force | Same rate limiter as login (20 / 15 min / IP) |
| Audit | `auth.password_reset` in `audit_log` |

## Change password (logged in) — Account page
Needs the **current** password. Logs out every *other* device, keeps this one. Sends the "password changed" email.

## Tests
`server/test/password.test.js` (8 tests): code email sent; same answer for unknown email and nothing sent; full reset + old session dead + old password fails + new works + notice email; link single-use; only newest link; expired link; garbage token; only hash stored; change-password needs current and logs out other devices.
