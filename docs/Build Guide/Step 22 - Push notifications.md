---
tags: [build-guide, push]
step: 22
---
# Step 22: Push notifications for new offers (session 15)

**What/why:** [[Push Notifications]], [[ADR-022 Push notifications]].

## 1. Package (inside `Unc-APP`)
```
npm install web-push --workspace server
```

## 2. Database: migration 10 (add it to the end of `MIGRATIONS` in `server/src/db.js`)
```sql
CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_push_user ON push_subscriptions(user_id);
```

## 3. Server
- `server/src/config.js`: add `push: { publicKey, privateKey, subject }`. The values come from `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` ([[Environment Variables]]).
- `server/src/lib/push.js`:
  - `vapidKeys()`: uses the env keys, or reads/creates `DATA_DIR/vapid.json` with `webpush.generateVAPIDKeys()`.
  - `sender`: calls `webpush.sendNotification(sub, payload, { TTL: 86400, vapidDetails })`. `setPushSender(fn)` lets tests replace it.
  - `TEXT`: the title and body for each kind, in `en` and `ar`.
  - `pushTo(db, userId, kind, vars, url)`:
    - skip banned members;
    - load the member's devices;
    - build the JSON payload `{title, body, url, lang, dir, tag}`;
    - send to all devices with `Promise.allSettled`;
    - delete devices that answer 404 or 410.
- `server/src/routes/push.js`:
  - `GET /key`;
  - `POST /subscribe`: checks for an https endpoint and base64url keys; uses `ON CONFLICT(endpoint) DO UPDATE`; keeps the newest 10 devices.
  - `POST /unsubscribe`;
  - `POST /test`.
  - Mount it in `app.js`: `app.use('/api/push', pushRoutes(db))`.
- `server/src/routes/conversations.js`: after the contact transaction, call `pushTo(db, listing.buyer_id, 'offer', { actor, title }, '/messages/<id>').catch(...)`.
- `server/src/lib/i18n.js`: Arabic for the 2 new error messages.

## 4. Client
- `client/public/sw.js`:
  - `push` event → `showNotification(title, { body, icon, tag, lang, dir, data: { url } })`;
  - `notificationclick` → focus an open Unc tab and go to the url, or open a new window.
- `client/src/push.js`:
  - `pushSupport()` returns `ok`, `ios-install`, `insecure` or `unsupported`;
  - `registerServiceWorker()`, called in `main.jsx`;
  - `enablePush()`: asks permission, then `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` with a 20-second timeout and a translated error ([[Mistakes and Fixes#M59]]), then `POST /api/push/subscribe`;
  - `disablePush()`.
- `client/src/components/PushSettings.jsx`: the card. It is used in `Account.jsx`, and in `Notifications.jsx` with `hideWhenOn`.
- `client/src/auth.jsx`: `logout()` calls `disablePush()` first.
- `client/src/locales/ar.js`: Arabic for every new text.

## 5. Check
```
npm test
npm run e2e
npm run e2e:ar
npm run e2e:devices
```
- `npm test`: 97 tests, including `push.test.js` (4).
- The browser tests only check that the card shows: headless Chrome can't subscribe ([[Mistakes and Fixes#M57]]).
- Real delivery: follow "Try it" in [[Push Notifications]].
