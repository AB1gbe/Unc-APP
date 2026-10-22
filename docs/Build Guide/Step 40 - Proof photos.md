---
tags: [build-guide, safety]
step: 40
---
# Step 40: Proof photos (session 34)

**What/why:** [[Privacy, Demand and Trust#3. Proof photos with a code]], [[ADR-040 Proof photos]].

1. Migration 23:
   ```sql
   ALTER TABLE messages ADD COLUMN proof TEXT CHECK (proof IN ('photo', 'ask'));
   ```
   (`messages.kind` can't be used: its CHECK only allows accept/decline.)
2. `server/src/routes/conversations.js`:
   - `proofCode(c)`: `UNC-` + 4 digits from a SHA-256 hash of the chat id and start time;
   - `GET /conversations/:id` adds `proofCode`;
   - `messageView` adds `proof` and shows `proof = 'ask'` as `kind: 'proof-ask'`; the inbox's `last_kind` does the same;
   - `POST /conversations/:id/messages` accepts `proof=1` (seller + photo only, else 400);
   - new `POST /conversations/:id/proof-request` (buyer only; 409 while an earlier ask has no proof photo after it);
   - `compareFor` adds `hasProof`.
3. Client:
   - `Conversation.jsx`: `ProofAskButton` (next to Report), `ProofAskLine` (with the steps for the seller), the `.proof-check` tick box when the seller attaches a photo, and the `.proof-badge`;
   - `Inbox.jsx`: "📸 Proof photo asked for";
   - `CompareOffers.jsx`: "✓ Proof photo".
4. Tests: `server/test/proof-photo.test.js`; `e2e/smoke.mjs` asks, sends and checks the badge.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
