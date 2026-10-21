---
tags: [build-guide, auth]
step: 14
---
# Step 14 — Password reset

**Why:** [[ADR-012 Password reset design]]. **Behaviour:** [[Password Reset]].

## 1. Database — append migration 2 in `server/src/db.js`
```sql
CREATE TABLE password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_password_resets_user ON password_resets(user_id);
```
Appended as a **new** entry — existing databases upgrade automatically on next start (`user_version` 1 → 2).

## 2. Routes — `server/src/routes/auth.js`
| Endpoint | Logic |
|---|---|
| `POST /forgot-password {email}` | If user exists & not banned: delete their old tokens, insert `sha256(token)` with expiry, `trySendMail(passwordResetEmail(token))` **without await**. Always `{ok, message}`. |
| `POST /reset-password/check {token}` | `findResetToken()` → 400 `RESET_INVALID` if unknown/used/expired |
| `POST /reset-password {token, password}` | validate → hash → in `tx()`: update password, set `used_at`, delete all sessions, mark email verified, audit → send "changed" email |
| `POST /change-password {currentPassword, password}` | `requireAuth`, verify current, update, delete sessions except `req.sessionTokenHash`, audit, email |

## 3. Client
- `ForgotPassword.jsx` — email form → neutral "if an account exists…" message.
- `ResetPassword.jsx` — reads `?token=`, calls `/check`; invalid → "link expired" + button; valid → password ×2 → on success `setUser(null)` and go to `/login` with a notice.
- `App.jsx` — routes `forgot-password`, `reset-password` (no guard).
- `Login.jsx` — "Forgot password?" link next to the password label; shows `state.notice`.
- `Account.jsx` — `ChangePassword` card.

## 4. Check it
```bash
npm test   # password.test.js: 8 tests
```
Manually: log out → Forgot password? → link printed in terminal (console mode) → open → new password → log in.
