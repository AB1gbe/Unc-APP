---
tags: [build-guide, trust]
step: 48
---
# Step 48: Hide contact details until a price is agreed (session 40)

**What/why:** [[Deals, Terms, Cards and Installments#1. Contact details hidden until a price is agreed]], [[ADR-048 Hide contact details until a price is agreed]].

1. Migration 29: `ALTER TABLE messages ADD COLUMN had_contact INTEGER NOT NULL DEFAULT 0;`
2. `shared/contact-mask.js`: `maskContacts(text)` → `{ text, found }` (emails, @handles, links, then 7+ digit numbers that aren't dates, then 7+ number words), and `hasContacts`. Order matters: handles before links ([[Mistakes and Fixes#M95]]).
3. `server/src/routes/conversations.js`:
   - `insertMessage` stores `had_contact`;
   - `agreedIn(convId)` = an `accept` message exists;
   - `messageView` masks the other person's text until then and adds `hiddenContact` / `hiddenForOther`;
   - the same for the inbox `lastMessage` (subquery `agreed`), Compare offers `firstMessage` and the new-offer email;
   - `GET /conversations/:id` adds `agreed`.
4. Client:
   - `components/ContactNudge.jsx`, shown in `Conversation.jsx` and on the offer form in `ListingDetail.jsx` while typing;
   - `.hidden-note` lines under messages;
   - `Conversation.jsx` reloads the whole chat once `agreed` turns true (polling only fetches new messages — [[Mistakes and Fixes#M99]]).
5. Tests: `server/test/contact-hiding.test.js`; `e2e/smoke.mjs` types a number, sees the nudge, and checks the shop sees 📵.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
