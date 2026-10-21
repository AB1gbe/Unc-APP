---
tags: [setup, config]
---
# Environment Variables

All settings live in `server/src/config.js`. Each reads an environment variable with a safe development default.

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | (unset) | Set to `production` when live. Turns on secure cookies, hides dev email codes, requires `SECRET_PEPPER`. |
| `PORT` | `4000` | Port the API listens on. |
| `DATA_DIR` | `server/data` | Where the database and uploaded files go. **Back this up.** |
| `DB_FILE` | `$DATA_DIR/unc.sqlite` | Database file path. |
| `SECRET_PEPPER` | `dev-only-pepper-change-me` | Secret mixed into ID-number and email-code hashes. **Required in production.** Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Never change it after launch (existing ID hashes would stop matching). |
| `ADMIN_EMAIL` | `admin@unc.local` | Admin account created on first start. |
| `ADMIN_PASSWORD` | `ChangeMe123!` | Its password. **Change in production.** Only used when the admin is first created. |
| `KYC_PROVIDER` | `manual` | Which KYC provider to use. See [[KYC Verification]]. |

## How to set them
- **Mac/Linux, one-off:** `PORT=4001 npm start`
- **Windows PowerShell:** `$env:PORT=4001; npm start`
- **Hosting platforms:** set them in the dashboard (Render, Railway, Fly.io all have an "Environment" page).
