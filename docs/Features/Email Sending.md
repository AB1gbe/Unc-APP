---
tags: [feature, email]
updated: 2026-10-21 (session 02)
---
# Email Sending

**Why this design:** [[ADR-011 Email delivery]].
**Where:** `server/src/lib/mailer.js` (how it's sent), `server/src/lib/emails.js` (what it says), settings in `server/src/config.js` → [[Environment Variables]].

## Emails the app sends
| When | Function in `emails.js` | Subject |
|---|---|---|
| Sign up / "send a new code" | `verificationCodeEmail(code)` | `123456 is your Unc verification code` |
| "Forgot password?" | `passwordResetEmail(token)` | `Reset your Unc password` |
| Password reset or changed | `passwordChangedEmail()` | `Your Unc password was changed` |
Each has a plain-text **and** an HTML version (some people/apps only show text). HTML uses tables + inline styles because many email apps strip `<style>` tags. Every user-supplied value is HTML-escaped (`esc()`).

![[20-reset-email.png]]

## Transports (`MAIL_TRANSPORT`)
| Value | What happens | Use for |
|---|---|---|
| `console` (default) | Printed in the terminal running the app | Development |
| `memory` | Kept in an array `outbox` | Automated tests (forced, can't be changed) |
| `smtp` | Sent with **nodemailer** to any SMTP server | Production — works with almost every provider |
| `resend` | Sent with one `fetch` call to Resend's HTTP API | Production, if you use Resend and prefer an API key over SMTP |
Production (`NODE_ENV=production`) **refuses to start** with `console`, so you can't go live and silently send no emails.

## Set up real email — step by step
1. **Pick a provider** and create an account. Rough guide (check each provider's current docs and free tier):
   | Provider | `SMTP_HOST` | `SMTP_PORT` | `SMTP_USER` | `SMTP_PASS` |
   |---|---|---|---|---|
   | Resend | `smtp.resend.com` | 587 | `resend` | your API key |
   | Brevo | `smtp-relay.brevo.com` | 587 | your login | SMTP key |
   | Postmark | `smtp.postmarkapp.com` | 587 | server token | server token |
   | Mailgun | `smtp.mailgun.org` | 587 | SMTP login | SMTP password |
   | Amazon SES | `email-smtp.<region>.amazonaws.com` | 587 | SMTP user | SMTP password |
   | Gmail (testing only, ~500/day) | `smtp.gmail.com` | 587 | your Gmail address | an **App Password** (needs 2-step verification on; your normal password won't work) |
2. **Verify your sending domain** in the provider's dashboard. It gives you DNS records (SPF, DKIM, often DMARC) to add where you bought your domain. Without this, emails land in spam or are refused. (Gmail testing skips this — you send as your own Gmail address.)
3. **Fill in `.env`:**
   ```
   APP_URL=http://localhost:5173
   MAIL_TRANSPORT=smtp
   MAIL_FROM=Unc <no-reply@yourdomain.com>
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=resend
   SMTP_PASS=re_xxxxxxxxxxxx
   ```
   Or with Resend's API: `MAIL_TRANSPORT=resend` + `RESEND_API_KEY=re_xxxxxxxxxxxx`.
4. Restart `npm run dev`. Sign up with your real address → the code arrives in your inbox. Once real email is on, the code is **no longer shown on the page** (that only happens with `console`).
5. Try **Forgot password?** → the link in the email should open your local site (`APP_URL`).

## What happens when sending fails
- `sendMail()` throws; `trySendMail()` logs `[mail] failed to send …` in the terminal and returns `false`.
- Sign-up still creates the account; the code page shows *"We couldn't send the email just now. Press 'Send a new code'"*.
- "Send a new code" returns an error message (HTTP 502) so the user knows to retry.
- "Forgot password?" always shows the same neutral message (privacy) — check the terminal log.

## Troubleshooting
| Terminal shows | Fix |
|---|---|
| `SMTP_HOST is not set` | Add it to `.env`, restart. |
| `Invalid login` / `535` | Wrong `SMTP_USER`/`SMTP_PASS`. Gmail: use an App Password. |
| `ECONNREFUSED` / timeout | Wrong host/port, or your network blocks port 587 → try 465 with `SMTP_SECURE=true`. |
| `Resend rejected the email (403)` | Domain not verified, or `MAIL_FROM` isn't on the verified domain. |
| Sent fine but lands in spam | Finish SPF/DKIM/DMARC DNS records; use a real `MAIL_FROM` domain. |
| Reset link opens `localhost` in production | Set `APP_URL=https://yourdomain.com`. |

## How it was tested
- `server/test/mail-transports.test.js`: starts a **real local SMTP server** (`smtp-server` package) and checks the email arrives with the right subject and link; checks failures are reported; checks the Resend call (fake `fetch`) and its error handling.
- Browser run: app started with `MAIL_TRANSPORT=smtp` pointing at a local SMTP catcher; the verification code and reset link were read from the **delivered** emails and used to complete sign-up and a password reset. See [[2026-10-21 Session 02]].
