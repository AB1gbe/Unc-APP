---
tags: [build-guide]
date: 2026-11-15
---
# Step 76 - Launch readiness

Why: [[Honest Review 2026-11-15]] and [[ADR-081 Launch focus]].
- Folder `Unc-APP`, branch `claude/vibrant-edison-r9o798`.
- Database change: migration 45 (`listing_images.thumb`).

## 1. Photo thumbnails
- `client/src/images.js`:
  - `makeThumb` makes a copy about 480px wide;
  - `appendPhotos` adds each photo plus its thumbnail (`thumbs`) to the form.
- `server/src/routes/listings.js`:
  - stores the thumbnail (`THUMB_MAX_BYTES` 150 KB; anything larger is dropped);
  - the API returns `thumbs` and `photos[].thumbUrl`.
- Grids and rows show `thumbs[0]` first, and fall back to the full photo.
- ID-check photos are shrunk to 2400px.

## 2. Free for businesses during launch
- `server/src/config.js` `chargeBusinesses` is off unless `CHARGE_BUSINESSES=1`.
- While it is off, businesses post without paying, and the Billing page says so.

## 3. Hidden extra features
- `client/src/features.js` turns off: installments, wallet, referrals, stories, proof photos, pickup checklist, demand, alerts, away mode, compare offers, teams.
- To see everything locally (Windows cmd, in `Unc-APP`):
  ```
  set VITE_ALL_FEATURES=1
  npm start
  ```

## 4. Safety
- 3 reports from different members with a confirmed email hide an ad (`REPORTS_TO_HIDE` in `server/src/routes/conversations.js`).
- `shared/scam-check.js` `normalize()` and `squash()` catch disguised words such as "W e s t e r n  U n i o n".

## 5. Backups
### Make a backup
- **Optional but strongly advised**, once a week and before every big change. Without one, a bad deploy or a mistaken delete can lose every account and ad.
- Steps:
  1. Log in as admin on the site.
  2. Open Admin.
  3. Click **Download backup**. It saves `unc-backup-<date>.json`.
  4. Keep the file off the computer too, for example in Google Drive. It holds members' emails and names, so store it privately.
- Not included:
  - login sessions;
  - photo files.
- On Cloudflare, photos are kept in Durable Object storage, which Cloudflare can roll back up to 30 days (point-in-time recovery).

### Restore a backup
In Windows cmd, in the `Unc-APP` folder:
```
node scripts/restore-backup.mjs C:\path\to\unc-backup-2026-11-15T10-00-00.json restored.sqlite
set DB_FILE=restored.sqlite
npm start
```
- The script refuses to overwrite a file that already exists.
- Code: `server/src/routes/admin.js` (`GET /api/admin/backup`) and `scripts/restore-backup.mjs`.

## Check
```
npm test
```
225 should pass.
