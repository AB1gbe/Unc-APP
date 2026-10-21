---
tags: [feature, auth]
updated: 2026-10-21 (session 02)
---
# Email Verification

**Where:** `server/src/routes/auth.js` (`issueEmailCode`, `/verify-email`, `/resend-code`), `client/src/pages/VerifyEmail.jsx`. Sending: [[Email Sending]].

- On register a 6-digit code is generated (`crypto.randomInt`), stored as a peppered hash, valid **15 minutes**, **5 attempts**.
- The email is sent with `verificationCodeEmail(code)`.
- **Only with `MAIL_TRANSPORT=console`** (and never in production) the API also returns `devCode`, which the page shows in a blue "Development mode" box. With real email configured you must use your inbox.
- If sending fails at sign-up, the account is still created and the page asks the user to press *Send a new code*.
- Email must be verified before KYC. Completing a password reset also marks the email verified (clicking the emailed link proves ownership).
