---
tags: [setup, config]
updated: 2026-10-21 (session 02)
---
# Environment Variables

All settings live in `server/src/config.js`. Each reads an environment variable with a safe development default.

## The easy way: a `.env` file
1. In the project folder copy `.env.example` → `.env` (Windows: `copy .env.example .env`; Mac/Linux: `cp .env.example .env`).
2. Edit `.env`: one `NAME=value` per line, `#` starts a comment.
3. Restart the app. `npm run dev`, `npm start` and `npm run seed` load it automatically through Node's built-in flag `--env-file-if-exists=../.env` (in `server/package.json`) — no extra package needed.
4. `.env` is in `.gitignore`: it is **never committed**, so passwords and API keys stay on your machine.
> Tests (`npm test`) deliberately ignore `.env` and always use the in-memory mailer, so they can never send real email.

## All variables
| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | (unset) | `production` when live: secure cookies, no dev codes, requires `SECRET_PEPPER` and a real `MAIL_TRANSPORT`. |
| `PORT` | `4000` | Port the API listens on. |
| `DATA_DIR` | `server/data` | Database + uploads. **Back this up.** |
| `DB_FILE` | `$DATA_DIR/unc.sqlite` | Database file path. |
| `SECRET_PEPPER` | `dev-only-pepper-change-me` | Secret mixed into ID-number and email-code hashes. **Required in production.** Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Never change after launch. |
| `ADMIN_EMAIL` | `admin@unc.local` | Admin created on first start. |
| `ADMIN_PASSWORD` | `ChangeMe123!` | Its password (only used when first created). **Change in production.** |
| `KYC_PROVIDER` | `manual` | See [[KYC Verification]]. |
| `APP_URL` | `http://localhost:5173` | Public website address, used to build links in emails (password reset). Production: `https://yourdomain.com`. If you run `npm start` locally, use `http://localhost:4000`. |
| `MAIL_TRANSPORT` | `console` | `console` (print), `smtp`, or `resend`. Production refuses to start with `console`. See [[Email Sending]]. |
| `MAIL_FROM` | `Unc <no-reply@unc.local>` | Sender shown in emails. Must be an address/domain your provider has verified. |
| `SMTP_HOST` | — | e.g. `smtp.resend.com`, `smtp.gmail.com` |
| `SMTP_PORT` | `587` | 587 (STARTTLS) or 465 (TLS) |
| `SMTP_SECURE` | `false` | `true` only for port 465 |
| `SMTP_USER` / `SMTP_PASS` | — | Login from your provider |
| `RESEND_API_KEY` | — | For `MAIL_TRANSPORT=resend` |

## Other ways to set them
- **One-off, Mac/Linux:** `PORT=4001 npm start`
- **One-off, Windows PowerShell:** `$env:PORT=4001; npm start`
- **Hosting platforms:** the dashboard's "Environment" page (Render, Railway, Fly.io…). Real environment variables win over `.env`.
