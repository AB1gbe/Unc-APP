---
tags: [feature, admin]
---
# Admin and Moderation

**Where:** `server/src/routes/admin.js`, `client/src/pages/admin/`.

- The admin account is created automatically on first start from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`ensureAdmin()` in `seed.js`). To add more admins today: open the DB and set `role = 'admin'` for that user.
- **Admin page** (`/admin`): counts, KYC queue (tabs pending/approved/rejected), open reports.
- **KYC review** (`/admin/kyc/:id`): see [[KYC Verification]].
- **Reports:** shows what was reported, by whom, why. *Read conversation* (only for reported ones, logged) → *Ban buyer / Ban vendor* → *Mark resolved*.
- **Bans:** set `banned_at`, delete all sessions (instant logout), block login, hide their requests from browse **and direct links** (admins still see them), block new offers on them, and block messages to them in existing conversations (session 05, [[Mistakes and Fixes#M24 – M35: bugs found by the code review (session 05)|Mistakes and Fixes M24–M35]]).
- **Audit log:** table `audit_log` records KYC submissions/decisions/file views, listing changes, conversation starts, report views, bans. No UI yet → [[Roadmap]].
- **Reports hide ads** (session 102): 3 reports from different members with a confirmed email hide an ad until an admin checks it. An ad already approved by an admin isn't hidden again.
- **Backup** (session 102): Admin → *Download backup* saves the whole database as JSON (no login sessions). Restore with `node scripts/restore-backup.mjs <file> <new.sqlite>`; see [[Step 76 - Launch readiness]].
