---
tags: [build-guide, safety]
step: 46
---
# Step 46: Pickup checklist and big-deal card (session 37)

**What/why:** [[Your Data, Dashboard and Care#4. Pickup checklist and big-deal safety card]], [[ADR-046 Pickup checklist and big-deal card]].

1. No migration. The conversation's `listing` now includes `category` (`server/src/routes/conversations.js`).
2. `client/src/pickup.js` (plain JS): `checklistFor(category)` (item keys) and `isBigDeal(price, currency)` with `BIG_DEAL` limits.
3. `client/src/components/PickupCard.jsx`: the words for each key, ticks in `localStorage` (`unc:pickup:<chat id>`, wrapped in try/catch), and the big-deal card.
4. `Conversation.jsx`: finds the last accepted price and shows `PickupCard` when there is one or a deal.
5. CSS `.pickup`, `.pickup-item` (normal weight — [[Mistakes and Fixes#M93]]), `.big-deal`.
6. Tests: `server/test/pickup.test.js`; `e2e/smoke.mjs` ticks an item and reloads.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
(`e2e` and `e2e:ar` need a running server on a fresh data folder; `e2e:devices` needs `npm run seed` and a running server.)
