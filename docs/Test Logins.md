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

**Admin:** `admin@unc.local` with the password saved as the `ADMIN_PASSWORD` secret in Cloudflare.

### Reset the admin password (session 95)
Since session 95 the secret **is** the admin password: when it changes, the next start sets the new password and logs the admin out everywhere.
1. Cloudflare → **Workers & Pages → unc-app → Settings → Build → Variables and secrets** → `ADMIN_PASSWORD` → edit → type the new password → Save. (Change the **build** secret: `npm run deploy` copies it to the running site on every publish.)
2. **unc-app → Deployments** → the newest build → **Retry build** (or ask Claude to publish anything).
3. About a minute after it finishes, log in as `admin@unc.local` with the new password.
