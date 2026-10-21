---
tags: [build-guide, privacy]
step: 29
---
# Step 29: "Hide when I'm online" (session 22)

**What/why:** [[ADR-029 Hide my activity]]. Builds on [[Step 26 - Activity and views]].

1. Migration 15 (add it to the end of `MIGRATIONS` in `server/src/db.js`):
   ```sql
   ALTER TABLE users ADD COLUMN hide_activity INTEGER NOT NULL DEFAULT 0;
   ```
2. `server/src/middleware/auth.js`:
   - in `loadUser`, don't update `last_seen_at` when `req.user.hide_activity` is set;
   - in `publicMe`, add `hideActivity: u.hide_activity === 1`.
3. `server/src/routes/auth.js` `PATCH /me`: accept `hideActivity`, a real boolean only (anything else → 400). When it is `true`, also set `last_seen_at = NULL`.
4. `server/src/lib/activity.js` `summaryFor`: return `lastSeenAt: null` when `hide_activity` is set. This is a second safety net.
5. `server/src/lib/i18n.js`: Arabic for `hideActivity must be true or false.`
6. `client/src/pages/Account.jsx`:
   - `ToggleSetting({ field, label, hint })` saves one setting at once, and puts the tick back if saving fails. It is now used by both the email card and the new **Privacy** card.
   - Each tick box has `data-setting=<field>` so tests can find it.
7. `client/src/locales/ar.js`: 3 new texts.
8. Check, inside `Unc-APP`:
   ```
   npm test
   npm run e2e
   npm run e2e:ar
   npm run e2e:devices
   ```
   - `npm test`: 115 tests, including a new one in `server/test/activity.test.js`. That test fails on the old code (checked with `git stash push -- server/src`).
   - `npm run e2e`: the seller sees "Active now" on the buyer's profile; the buyer turns on hiding; after a reload it's gone.
