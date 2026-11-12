---
tags: [build-guide, hosting, cloudflare]
step: 69
---
# Step 69: Cloudflare test site at unc.b1gbe.org (session 79)

**Optional, but it's what lets you stop using cmd:** Unc runs on Cloudflare and updates itself whenever `main` changes. Your PC version keeps working exactly as before. Why it's built this way: [[ADR-069 Cloudflare test site]].

## A. One-time setup (done by the owner in the Cloudflare dashboard)
The owner connected the repository directly: **Workers & Pages → Create → Import a repository → AB1gbe/Unc-APP**, project name **unc-app**. Cloudflare ("Workers Builds") then builds and publishes on every push. Settings to check in **unc-app → Settings → Build**:
- **Production branch:** `main`
- **Build command:** `npm run build` (it also copies the demo photos)
- **Deploy command:** `npx wrangler deploy` (it reads `wrangler.jsonc` in the top folder)
- **Root directory:** empty (the top folder)

Two more things in the dashboard, both important:
1. **Admin password** (the default `ChangeMe123!` is public): **unc-app → Settings → Variables and Secrets → Add** → type **Secret**, name `ADMIN_PASSWORD`, a strong value → Deploy. Optional: `SECRET_PEPPER` (a long random text, never change it later). Set them **before the first visit**: the admin account is created on the first visit with the password at that moment.
2. **Your address:** **unc-app → Domains** (or Settings → Domains & Routes) → **Add → Custom domain** → `unc.b1gbe.org`. It also works at the `…workers.dev` address shown there.

## B. Updating
Tell Claude "merge it" (or merge a pull request yourself). Every push to `main` builds and publishes by itself: **unc-app → Deployments** shows each one.

## C. How it works (files)
- `wrangler.jsonc` (top folder): name `unc-app`, the website (`client/dist`), the Durable Object `UncServer`, the stand-ins (`alias`), settings (`vars`).
- `cloudflare/worker.js`: pages come from static assets; `/api/*` and `/uploads/*` go to the Durable Object "main". Hourly jobs run on an alarm.
- `cloudflare/start.js`: opens the database, creates the admin, loads demo data once (`SEED_DEMO=1`, photos from `client/dist/demo-photos`), starts the normal Express app.
- `cloudflare/shims/sqlite.js`: `node:sqlite`'s `DatabaseSync` on the Durable Object's SQLite (`transactionSync` for transactions, `user_version` in `_meta`).
- `cloudflare/shims/fs.js`: uploads as rows in `_files`.
- In the app (works on a PC too):
  - `tx()` and migrations use `db.transactionSync` when it exists;
  - `sendStored()` in `server/src/lib/uploads.js` sends photos and videos;
  - no app compression on Cloudflare;
  - `config.js` and `seed.js` work without a file path.
- `scripts/copy-demo-photos.mjs` (end of `npm run build`): copies `server/demo-photos/*.jpg` to `client/dist/demo-photos/`.

## D. Trying the Cloudflare version on a computer (optional, for developers)
```
npm run build
npx wrangler dev --port 8790
```
Open http://localhost:8790. Browser tests against it: `set BASE_URL=http://127.0.0.1:8790` then `node e2e/smoke.mjs` (start wrangler with `--var SEED_DEMO:0` for an empty database).

## E. Starting the test site over (wipe all its data)
In `wrangler.jsonc`, add a new entry to `migrations`, e.g. `{ "tag": "v2", "deleted_classes": ["UncServer"] }` then `{ "tag": "v3", "new_sqlite_classes": ["UncServer"] }`, and merge. Ask Claude if unsure.
