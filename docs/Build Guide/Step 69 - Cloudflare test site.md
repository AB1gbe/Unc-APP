---
tags: [build-guide, hosting, cloudflare]
step: 69
---
# Step 69: Cloudflare test site at unc.b1gbe.org (session 79)

**Optional, but it's what lets you stop using cmd:** Unc runs on Cloudflare and updates itself whenever `main` changes. Your PC version keeps working exactly as before. Why it's built this way: [[ADR-069 Cloudflare test site]].

## A. One-time setup (only you can do this; about 10 minutes)
Keys never go in a chat; you paste them straight into GitHub.
1. **Cloudflare key.** In the Cloudflare dashboard: your profile icon (top right) → **My Profile** → **API Tokens** → **Create Token** → template **Edit Cloudflare Workers** → **Use template**.
   - Account Resources: your account.
   - Zone Resources: **Include → Specific zone → b1gbe.org**.
   - **+ Add more**: **Zone → DNS → Edit** (so it can create `unc.b1gbe.org`).
   - **Continue to summary** → **Create Token** → **Copy** (it's shown once).
2. **Account ID.** Cloudflare dashboard → **Workers & Pages** (left menu) → the **Account ID** on the right → copy.
3. **GitHub secrets.** github.com/AB1gbe/Unc-APP → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add these four:
   - `CLOUDFLARE_API_TOKEN` = the key from step 1
   - `CLOUDFLARE_ACCOUNT_ID` = the ID from step 2
   - `UNC_ADMIN_PASSWORD` = a strong admin password for the test site (the default `ChangeMe123!` is public!)
   - `UNC_SECRET_PEPPER` = any long random text (e.g. 40 random letters). **Never change it later.**
4. Start the first publish: **Actions** tab → **Cloudflare test site** → **Run workflow** (or merge a pull request). After 2–3 minutes, open **https://unc.b1gbe.org**.
   - The first visit takes a few seconds: it creates the database and loads the demo data.
   - Log in with the demo accounts (password `Password123`) or as `admin@unc.local` with your `UNC_ADMIN_PASSWORD`.

## B. Updating
Tell Claude "merge it" (or merge a pull request yourself). Every change to `main` runs **Actions → Cloudflare test site**: tests → build → publish. You can watch it in the Actions tab.

## C. How it works (files)
- `cloudflare/wrangler.jsonc`: name `unc-test`, the website (`../client/dist`), the Durable Object `UncServer`, the stand-ins (`alias`), settings (`vars`), the address (`routes`).
- `cloudflare/worker.js`: pages come from static assets; `/api/*` and `/uploads/*` go to the Durable Object "main". Hourly jobs run on an alarm.
- `cloudflare/start.js`: opens the database, creates the admin, loads demo data once (`SEED_DEMO=1`, photos from `client/dist/demo-photos`), starts the normal Express app.
- `cloudflare/shims/sqlite.js`: `node:sqlite`'s `DatabaseSync` on the Durable Object's SQLite (`transactionSync` for transactions, `user_version` in `_meta`).
- `cloudflare/shims/fs.js`: uploads as rows in `_files`.
- In the app (works on a PC too):
  - `tx()` and migrations use `db.transactionSync` when it exists;
  - `sendStored()` in `server/src/lib/uploads.js` sends photos and videos;
  - no app compression on Cloudflare;
  - `config.js` and `seed.js` work without a file path.
- `scripts/cloudflare-build.mjs`: `npm run build` + copy `server/demo-photos/*.jpg` to `client/dist/demo-photos/`.
- `.github/workflows/cloudflare-test.yml`: the auto-publish.

## D. Trying the Cloudflare version on a computer (optional, for developers)
```
node scripts/cloudflare-build.mjs
cd cloudflare
npx wrangler dev --port 8790
```
Open http://localhost:8790. Browser tests against it: `set BASE_URL=http://127.0.0.1:8790` then `node e2e/smoke.mjs` (start wrangler with `--var SEED_DEMO:0` for an empty database).

## E. Starting the test site over (wipe all its data)
In `cloudflare/wrangler.jsonc`, add a new entry to `migrations`, e.g. `{ "tag": "v2", "deleted_classes": ["UncServer"] }` then `{ "tag": "v3", "new_sqlite_classes": ["UncServer"] }`, and merge. Ask Claude if unsure.
