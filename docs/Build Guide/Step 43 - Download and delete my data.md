---
tags: [build-guide, privacy]
step: 43
---
# Step 43: Download and delete my data (session 37)

**What/why:** [[Your Data, Dashboard and Care#1. Download my data and delete my account]], [[ADR-043 Download and delete my data]].

1. Migration 26 in `server/src/db.js`:
   ```sql
   ALTER TABLE users ADD COLUMN delete_requested_at TEXT;
   ALTER TABLE users ADD COLUMN deleted_at TEXT;
   CREATE TABLE banned_id_hashes (id_number_hash TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')));
   ```
2. `server/src/lib/deletion.js`:
   - `exportData(db, user)`: one object, my data only;
   - `runDeletions(db)`: accounts asked for more than 7 days ago → `deleteNow`;
   - `deleteNow(db, user)`: in one transaction, wipe KYC rows (keeping the ID fingerprint in `banned_id_hashes` if banned), photos, stories, settings tables; rename to "Deleted member", new random email/password, set `banned_at` and `deleted_at`; then delete the files.
3. `server/src/index.js`: call `runDeletions(db)` at start-up and in the hourly timer.
4. `server/src/routes/auth.js`: `GET /me/export` (Content-Disposition attachment), `POST /me/delete` (password; not admins; close open requests; log out other devices), `POST /me/delete/cancel`. `publicMe` adds `deleteAt`.
5. `server/src/routes/kyc.js`: also refuse IDs found in `banned_id_hashes`.
6. Client: `Account.jsx` → `YourData` card (download link `/api/auth/me/export`, password form); `components/DeletePending.jsx` shown in `Layout.jsx` and in the card.
7. Tests: `server/test/account-deletion.test.js`; `e2e/smoke.mjs` downloads, asks to delete, then keeps the account.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
