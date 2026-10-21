---
tags: [build-guide, notifications]
step: 21
---
# Step 21 — Saved requests and notifications (session 13)

**What/why:** [[Saved Requests and Notifications]], [[ADR-021 Saved requests and notifications]].

## 1. Database: migrations 8 and 9
```sql
CREATE TABLE saved_listings (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, listing_id)
);
CREATE INDEX idx_saved_listing ON saved_listings(listing_id);
```
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);
CREATE INDEX idx_notifications_user ON notifications(user_id, id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
```
`cleanupExpired()` also deletes read notifications that are older than 90 days.

## 2. Server
- `routes/listings.js`, declared **before** `/:id`:
  - `GET /saved`;
  - `PUT /:id/save` (404 if the request is not open; 400 for your own request);
  - `DELETE /:id/save`.
- The detail view sets `listing.saved` for logged-in members who aren't the owner.
- `lib/notify.js`: `notify(db, userId, kind, { actorId, listingId, conversationId })`. Kinds: `offer`, `deal`, `rating`, `kyc_approved`, `kyc_rejected`.
- Where `notify()` is called:
  - `conversations.js` (a new conversation → the buyer gets `offer`);
  - `listings.js` (a deal is created → the seller gets `deal`; deleting a deal also deletes its `deal` notification);
  - `ratings.js` (the rated member gets `rating`);
  - `kyc/index.js` `applyDecision` (only when the newest submission is decided).
- `routes/notifications.js`:
  - `GET /` (latest 50, plus `unread`);
  - `GET /unread-count`;
  - `POST /read`.
- `app.js`: `app.use('/api/notifications', notificationRoutes(db))`.
- `lib/i18n.js`: Arabic for "You can't save your own request."

## 3. Client
- `ListingDetail.jsx` `SaveButton` (♡ Save / ♥ Saved, `aria-pressed`).
- `pages/Saved.jsx` (route `/saved`).
- Home: "♥ Saved for later" (first 3).
- Account: link to `/saved`.
- `pages/Notifications.jsx`:
  - `describe(n)` turns `kind` into text and a link;
  - opening the page calls `POST /read` and then fires `unc:read`.
- `Layout.jsx`:
  - a bell `NavLink` (class `bell`) with the count, visible on all screen sizes;
  - `refreshUnread` fetches both counts.
- Arabic for all new text in `locales/ar.js`.

## 4. Check
```
npm test
npm run e2e
npm run e2e:ar
```
- Tests: `saved.test.js` (2), `notifications.test.js` (3), and index checks in `performance.test.js`. 93 in total.
- `e2e/smoke.mjs` saves a request, sees it on `/saved` and on Home, and checks that the 🔔 count appears after an offer and disappears after opening the page.
