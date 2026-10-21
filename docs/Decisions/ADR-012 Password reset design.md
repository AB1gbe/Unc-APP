---
tags: [decision, security, auth]
status: accepted
date: 2026-10-21
---
# ADR-012 Password reset: single-use emailed link

## Options considered
| Option | Pros | Cons |
|---|---|---|
| **Emailed link with random token** ✅ | One click, familiar, token too long to guess (256 bits) | Link can be forwarded — mitigated by 30 min + single use + "password changed" alert |
| Emailed 6-digit code | Works if links are blocked | 1-in-a-million guessable → needs strict attempt limits per account; more typing |
| Security questions | No email needed | Weak, guessable, bad practice ❌ |
| SMS code | Second channel | Cost, SIM-swap risk, needs phone numbers we don't collect ❌ |
| Admin resets manually | Simple | Doesn't scale, social-engineering risk ❌ |

## Decision details
- Token: `randomToken()` = 32 random bytes, base64url. DB stores `SHA-256(token)` only (same pattern as sessions, [[ADR-004 Authentication]]).
- 30-minute expiry, single use, newest-only.
- Same response whether or not the email exists; email sent without `await` so timing doesn't leak either.
- On success: all sessions deleted, email marked verified, audit entry, notification email.
- The reset page calls `/reset-password/check` first so an expired link shows "request a new one" *before* the user types a password.
- Also added **change password** for logged-in users (needs current password; logs out other devices).
