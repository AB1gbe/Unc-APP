---
tags: [build-guide, email]
step: 13
---
# Step 13 — Real email sending

**Why:** [[ADR-011 Email delivery]]. **Full feature + provider setup:** [[Email Sending]].

## 1. Install (from the repo root!)
```bash
npm install nodemailer@10 --workspace server
npm install -D smtp-server@3 --workspace server
```

## 2. Settings — `server/src/config.js`
- `mailTransport`: `'memory'` when testing, otherwise `MAIL_TRANSPORT` or `'console'`. In production, throw if it's still `console`/`memory`.
- Add to `config`: `appUrl` (from `APP_URL`, trailing `/` removed), `resetTokenMinutes: 30`, and `mail: { transport, from, smtp: {host, port, secure, user, pass}, resendApiKey }`.

## 3. Sender — `server/src/lib/mailer.js`
- `sendMail({to, subject, text, html})` → `switch (config.mail.transport)`: `memory` pushes into exported `outbox`; `console` logs; `smtp` uses a lazily-created `nodemailer.createTransport({host, port, secure, auth})`; `resend` does `fetch('https://api.resend.com/emails', {Authorization: Bearer KEY})` and throws if `!res.ok`.
- `trySendMail(mail)` → catches, logs `[mail] failed…`, returns `true/false`.
- `resetSmtpTransport()` → for tests that change SMTP settings.

## 4. Wording — `server/src/lib/emails.js`
`layout(title, bodyHtml)` (table layout, inline styles, `esc()` for values) + `verificationCodeEmail`, `passwordResetEmail` (also returns `url`), `passwordChangedEmail`. Use HTML entities like `&mdash;` for special characters ([[Mistakes and Fixes#M16]]).

## 5. Use it — `server/src/routes/auth.js`
- `issueEmailCode()` now only saves the code; the route sends it with `trySendMail`.
- `register` returns `emailSent`; `resend-code` returns **502** if sending failed.
- `devCode` only when `!isProd` **and** transport is `console`/`memory`.

## 6. `.env` support — `server/package.json`
Add `--env-file-if-exists=../.env` to `dev`, `start`, `seed` (not `test`). Create `.env.example` at the root. Details: [[Environment Variables]].

## 7. Client
`Register.jsx` passes `emailFailed` to `VerifyEmail.jsx`, which shows a warning and a spam-folder hint.

## 8. Test command — `server/src/mail-test.js` (session 03)
Prints the transport/host/sender, sends one email to the address given, and on failure prints a hint (wrong login → App Password; can't connect → try 465). Scripts: server `"mail:test": "node --disable-warning=ExperimentalWarning --env-file-if-exists=../.env src/mail-test.js"`, root `"mail:test": "npm run mail:test --workspace server --"` (the trailing `--` passes your email address through).

Also in `config.js`: when `SMTP_HOST` is `smtp.gmail.com`, strip whitespace from `SMTP_PASS`.

## 9. Check it
```bash
npm test                              # mail-transports.test.js sends through a real local SMTP server
npm run mail:test -- you@example.com  # with your .env
```
Then follow [[Email Sending#Set up real email — step by step]] with your provider.

Next → [[Step 14 - Password reset]]
