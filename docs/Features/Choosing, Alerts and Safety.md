---
tags: [feature, vision]
---
# Choosing offers, alerts, areas, safety, fresh requests (session 31)

The "recommended next five" from [[More Ideas for the Vision]], all built in [[2026-10-22 Session 31]]. Each one keeps the MUST: contact happens only inside a request's conversation.

## 1. Compare offers side by side
**Why:** [[ADR-033 Compare offers]] · **Build:** [[Step 33 - Compare offers]]
**Where:** `compareFor()` in `server/src/routes/conversations.js`, `client/src/components/CompareOffers.jsx` (at the bottom of the buyer's own request page)

![[s31-compare-offers.png]]

- From 2 offers, the buyer sees every offer as a card:
  - the seller's **latest price** (or "Agreed: $350" after an accept), with **Lowest** on the cheapest;
  - rating, usual reply time and badges;
  - the first photo and message;
  - unread messages.
- **Sort by** lowest price, best rating or fastest replies. Tap a card to open that chat.
- Only the request's buyer gets this data; sellers never see each other's offers.

## 2. Request alerts for sellers
**Why:** [[ADR-034 Request alerts]] · **Build:** [[Step 34 - Request alerts]]
**Where:** `server/src/routes/alerts.js`, `client/src/pages/Alerts.jsx` (`/alerts`), linked from Browse and Account

![[s31-alerts.png]]

- Up to 10 alerts, each with any of these: **words** (all must appear), **category**, **city or governorate**, **budget at least**.
- From Browse, "🔔 Alert me about new requests like these" opens the form with the current search filled in.
- Each matching new request sends a 🔔 notification and a phone push ("New request for you").
- Never for your own request. A seller who already got a favourite-seller heads-up for that request doesn't get a second notification.

## 3. Bahrain governorates and areas
**Why:** [[ADR-035 Bahrain areas]] · **Build:** [[Step 35 - Bahrain areas]]
**Where:** `shared/areas.js` (used by both server and website), `client/src/components/CityField.jsx`

![[s31-ar-areas.png]]

- The 4 governorates and about 45 areas, each with an Arabic name and common spellings.
- **Saved tidy:** "manama", "المنامة" and "Manama City" all become **Manama**. Unknown places (e.g. "Austin") still work as typed.
- **City fields suggest the areas**, with their Arabic names and governorates. On Browse and in alerts you can also pick a whole governorate: "Capital Governorate" finds every area in it.
- **Shown in your language:** 📍 الجفير on the Arabic site.
- "Happening near you" also counts your **governorate** as near.
- To add an area, edit the lists at the top of `shared/areas.js`.

## 4. Block a member, and scam warnings
**Why:** [[ADR-036 Block and scam warnings]] · **Build:** [[Step 36 - Block and scam warnings]]
**Where:** `server/src/routes/blocks.js`, `server/src/lib/blocks.js`, `client/src/scam.js`, `client/src/pages/Conversation.jsx`, Account → Privacy

![[s31-scam-warning.png]]

- **🚫 Block** appears next to **Report** in a chat, and blocking works both ways for contact:
  - neither member can send the other new offers or messages; old chats stay readable;
  - the blocker stops seeing the blocked member's requests on Browse, Home and the feed;
  - the blocked member gets no favourite heads-up or alert about the blocker's requests, and blocking also removes a favourite.
- The blocker sees "You blocked … · Unblock". The other person only sees "You can't reply in this conversation" and is never told they were blocked.
- **Account → Privacy** lists blocked members, with **Unblock**.
- **Scam warning:** when the *other* person's message asks for payment up front (transfer, deposit, عربون, تحويل…), contains a bank account number (IBAN), or has a link, a yellow note appears under it: "Be careful: never send money before you've seen the item…". It's only a warning; nothing is blocked or reported automatically.

## 5. "Still looking?" expiry and tips
**Why:** [[ADR-037 Expiry and tips]] · **Build:** [[Step 37 - Expiry and tips]]
**Where:** `server/src/lib/expiry.js` (runs hourly), `POST /api/listings/:id/renew`, `client/src/tips.js`, `ExpiryLine` and `Tips` in `client/src/pages/ListingDetail.jsx`

![[s31-tips.png]]

**Expiry**
- An open request closes by itself **30 days** after it was posted (or last kept open or reopened).
- **3 days before**, the buyer gets a 🔔 and a push: "Still looking? … closes in 3 days".
- On their request, the buyer sees **⏳ Open until 21 Nov**. In the last week a **Keep it open** button appears, which starts the 30 days again.
- An expired request says so, and can be reopened at any time.

**Tips:** at most 2 on your own open request, only when they apply:
- add a photo;
- add more details;
- add a budget;
- no offers after 2 days: widen the budget or area, or share it;
- nobody has looked yet: share it.

## Tests
- `npm test`:
  - `compare-offers.test.js` (1), `alerts.test.js` (3), `areas.test.js` (3), `blocks-scam.test.js` (3), `expiry-tips.test.js` (2);
  - index checks in `performance.test.js`.
- `e2e/smoke.mjs`:
  - the seller saves an alert and gets it when the buyer posts; the request shows "Open until";
  - the second request shows the photo tip;
  - a pay-first message shows the warning; the buyer blocks, then unblocks.
- `e2e/devices.mjs` opens the request with 2 offers (Compare offers) and `/alerts` (11 pages).
