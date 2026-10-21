---
tags: [feature, email]
updated: 2026-10-21 (session 03)
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
| A seller makes an offer on your request (session 17; only while **Account → Email notifications** is ticked) | `newOfferEmail({...})` | `New offer on “<request title>”` |

### The new-offer email (session 17)
| English | Arabic |
|---|---|
| ![[s17-offer-email-en.png]] | ![[s17-offer-email-ar.png]] |

- **Who and when:** sent to the buyer, once per new offer (not for replies), right after the offer is saved. It goes through `trySendMail`, so a failed email never fails the offer.
- **What it says:** the seller's name, the request, the price (if one was given), the first 300 characters of the message, a **See the offer** button and a footer link to turn these emails off.
- **Language:** the buyer's language (`users.language`).
- **Member text direction:** member-written text (names, titles, messages) gets its own direction set explicitly. In HTML that is `<span dir="ltr|rtl">` from `textDir()`; in subjects and plain text, Unicode isolate marks. Email apps ignore `dir="auto"` and `<bdi>` ([[Mistakes and Fixes#M61]]).
- **Why:** [[ADR-023 Email for new offers]].
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

## Quick test with your personal Gmail (no domain needed)
Best for trying things out on your own computer. Gmail allows roughly 500 emails a day and sends **as your Gmail address** — fine for testing, not for real users. Added in [[2026-10-21 Session 03]].

**1. Turn on 2-Step Verification** (Google requires it for App Passwords)
Go to https://myaccount.google.com/security → *2-Step Verification* → turn on. Skip if it's already on.

**2. Create an App Password**
Go to https://myaccount.google.com/apppasswords → name it `Unc` → *Create*. Google shows a 16-letter password like `abcd efgh ijkl mnop`. Copy it. You can paste it with or without the spaces — the app removes them for Gmail.
> If the page says the setting isn't available: 2-Step Verification is off, or it's a work/school account whose admin disabled App Passwords. Use a personal Gmail.
> This password gives full access to send from your mailbox. **Never commit it, paste it in a chat, or share screenshots of it.** You can revoke it any time on the same page.

**3. Create `.env`** in the project folder (Windows cmd, inside `Unc-APP`):
```
copy .env.example .env
notepad .env
```
Replace the email part so it reads (with **your** Gmail address and App Password):
```
APP_URL=http://localhost:5173
MAIL_TRANSPORT=smtp
MAIL_FROM=Unc <your.address@gmail.com>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.address@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```
Save and close Notepad. `MAIL_FROM` must be your Gmail address — Gmail replaces any other sender with it anyway.

**4. Send a test email** (no need to start the app):
```
npm run mail:test -- your.address@gmail.com
```
| You see | Meaning |
|---|---|
| `Sent! Check the inbox (and the spam folder).` | Working ✅ |
| `Transport: console … only printed` | `.env` not found or `MAIL_TRANSPORT` not `smtp`. Make sure the file is named exactly `.env` (Notepad sometimes saves `.env.txt` — in *Save as* pick *All files*) and is inside `Unc-APP`. |
| `Invalid login: 535 … not accepted` + hint | Wrong address or you used your normal password. Use the App Password. |
| `ECONNREFUSED` / `ETIMEDOUT` + hint | Network blocks port 587 → set `SMTP_PORT=465` and `SMTP_SECURE=true`. |

**5. Try it in the app:** `npm run dev` → sign up using your Gmail address (or a `+` alias like `your.address+buyer1@gmail.com`, which also lands in your inbox — handy for making several test accounts) → the code arrives by email. Then log out → *Forgot password?* → the reset link arrives too.

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
