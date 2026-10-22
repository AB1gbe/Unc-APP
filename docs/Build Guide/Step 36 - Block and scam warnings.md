---
tags: [build-guide, safety]
step: 36
---
# Step 36: Block and scam warnings (session 31)

**What/why:** [[Choosing, Alerts and Safety#4. Block a member, and scam warnings]], [[ADR-036 Block and scam warnings]].

1. Migration 20:
   ```sql
   CREATE TABLE blocks (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, blocked_id));
   CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);
   ```
2. `server/src/lib/blocks.js`: `blockedBetween(db, a, b)` and `NOT_BLOCKED_BUYER` (an SQL condition).
3. `server/src/routes/blocks.js`:
   - `POST /members/:id/block` (also deletes the favourite; audited);
   - `DELETE /members/:id/block`;
   - `GET /blocks`.
4. Enforce it:
   - `routes/conversations.js`: contact → 403; messages and respond → 409; `blocked` and `iBlocked` on the conversation;
   - `routes/listings.js` (browse, for-you) and `routes/feed.js`: `NOT_BLOCKED_BUYER`;
   - `routes/favourites.js` and `routes/alerts.js`: `NOT EXISTS (... blocks ...)`.
5. Client:
   - `Conversation.jsx`: `BlockLink` next to `ReportLink`, and `BlockedNotice` in place of the message box;
   - `Account.jsx`: `BlockedMembers` in the Privacy card;
   - `client/src/scam.js`: `scamSignals(text)` returns `payment`, `iban` and/or `link`;
   - a `.scam-warning` note under the other person's flagged messages.
6. CSS fix: `.linkish.small { font-size: .875rem }` ([[Mistakes and Fixes#M81]]).
7. Tests: `server/test/blocks-scam.test.js`. `e2e/smoke.mjs` sends a pay-first message, checks the warning, blocks (`page.once('dialog', d => d.accept())`), then unblocks.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
