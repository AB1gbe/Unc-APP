---
tags: [howto]
---
# Test logins (test site and `npm run seed`)

These are **demo accounts** made by the seed ([[Step 69 - Cloudflare test site]], `SEED_DEMO=1`). Every one uses the password **Password123**. They are public, so they're for testing only, never for real data.

| Email | What it is |
|---|---|
| `buyer@demo.local` | Sam Buyer: a person, fully verified (ID check approved, test card). Best for "view it as a user". |
| `vendor@demo.local` | Riverside Electronics: a business, verified; has the Business panel. |
| `freelancer@demo.local` | Alex Finder: a person who answers requests. |
| `furniture@demo.local`, `autoparts@demo.local`, `phonefix@demo.local` | More demo shops. |
| `fatima@demo.local`, `hussain@demo.local`, `noor@demo.local` | People who posted demo ads and requests. |

**Admin:** `admin@unc.local` with the password saved as the `ADMIN_PASSWORD` secret in Cloudflare (unc-app → Settings). The admin account is created once, the first time the site starts with that secret; changing the secret later does **not** change the password.
