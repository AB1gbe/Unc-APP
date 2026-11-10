---
tags: [build-guide, help]
step: 59
---
# Step 59: Get Help (session 60)

**What/why:** [[Get Help]], [[ADR-059 Get Help inside the app]].

1. Migration 38 in `server/src/db.js` (append, never edit older ones): the tables `support_tickets` (`user_id`, `topic`, `status` open/answered/closed, times) and `support_messages` (`ticket_id`, `from_admin` 0/1, `body`), with indexes.
2. `server/src/routes/support.js` (new):
   - members: `GET /`, `POST /` (topic + message, at most 3 open), `POST /:id/messages`, `POST /:id/close`; only their own questions (others get 404);
   - admins (`requireAdmin`): `GET /admin?status=`, `POST /admin/:id/reply` (sets *answered* and sends the `support-reply` notification), `POST /admin/:id/close`.
   The admin routes are declared **before** `/:id` so "admin" isn't read as a question id.
3. `server/src/app.js`: `app.use('/api/support', supportRoutes(db));`
4. `server/src/lib/notify.js`: add `'support-reply'` to `KINDS`. `server/src/routes/admin.js`: `openHelp` in `/stats`.
5. `server/src/lib/deletion.js`: `helpQuestions` in the export; delete the member's questions with the account.
6. `server/src/lib/i18n.js`: Arabic for the three new error messages and the `topic` field label.
7. Client:
   - `client/src/pages/Help.jsx` (FAQ + contact form + "Your questions"); route `help` in `client/src/App.jsx`;
   - links in `pages/Account.jsx` and `pages/Login.jsx`;
   - the `support-reply` wording and ❓ icon in `pages/Notifications.jsx`;
   - the "Help questions" section in `pages/admin/AdminHome.jsx`;
   - styles at the end of `styles.css`; Arabic in `locales/ar.js`.
8. Tests: `server/test/support.test.js` (4 tests); a Help step in `e2e/smoke.mjs`; `/help` in `e2e/devices.mjs`.

Then check, inside `Unc-APP` (Windows cmd, branch `claude/vibrant-edison-r9o798`):
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
