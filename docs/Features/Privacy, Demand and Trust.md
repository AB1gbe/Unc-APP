---
tags: [feature, vision]
---
# Privacy, demand, proof photos, offer details, closing (session 34)

The "recommended next five" from [[Fresh Ideas for the Vision]], all built in [[2026-10-22 Session 34]]. Each one keeps the MUST: contact happens only inside a request's conversation.

## 1. Who may contact me + show only my first name
**Why:** [[ADR-038 Who may contact me and first name only]] · **Build:** [[Step 38 - Who may contact me and first name only]]
**Where:** `server/src/lib/contact.js`, `shared/names.js`, `client/src/pages/NewListing.jsx` ("Who can make offers?"), `client/src/pages/Account.jsx` (Privacy)

![[s34-favourites-only.png]]

- **Who can make offers?** on every request (default: any verified seller). The other choices are:
  - only shops (business accounts);
  - only sellers rated 4★ or more (at least one visible rating, average 4 or more);
  - only my favourite sellers.
- Requests show a grey 🔒 badge ("Shops only"…). A seller who doesn't qualify sees why instead of the offer form. The server refuses with 403 too.
- "Requests for you", favourite heads-ups and request alerts leave out requests the seller may not answer.
- Changing the rule never cuts off sellers who already wrote.
- **Show only my first name** (Account → Privacy, personal accounts only). Other members see "Sam B." on requests, profiles, reviews, stories and notifications. In a chat, the full name shows to the seller once you send a message there. You always see your own full name. Shops always show their full name.

## 2. What people are asking for (unmet demand)
**Why:** [[ADR-039 Unmet demand board]] · **Build:** [[Step 39 - Unmet demand board]]
**Where:** `server/src/routes/demand.js` (`GET /api/demand`), `client/src/pages/Demand.jsx` (`/demand`), linked from Browse and Home

![[s34-demand.png]]

- For verified members. It looks at open requests from the last 30 days, by category:
  - how many requests, and how many are still waiting for an offer (those categories come first);
  - "Often asked for": words used in at least 2 waiting requests.
- **Counts only**: no names, no single request's words, and a category shows only from 2 requests.
- Narrow it to a governorate with the **Area** box.

## 3. Proof photos with a code
**Why:** [[ADR-040 Proof photos]] · **Build:** [[Step 40 - Proof photos]]
**Where:** `proofCode()` and `POST /api/conversations/:id/proof-request` in `server/src/routes/conversations.js`, `client/src/pages/Conversation.jsx`

![[s34-proof-photo.png]]

- Every chat has its own code, like **UNC-4561**. Both people see the same one.
- The buyer taps **📸 Ask for a proof photo** under the chat. The seller sees how: write the code on paper, put it next to the item, send a photo and tick "proof photo".
- The photo gets a green **✓ Proof photo · UNC-4561** badge. The buyer is told to check that the paper says the code.
- A photo copied from the internet can't show this chat's code, which was made when the chat started.
- Compare offers shows **✓ Proof photo** for sellers who sent one.

## 4. Offer details: condition, warranty, returns, valid until
**Why:** [[ADR-041 Offer details]] · **Build:** [[Step 41 - Offer details]]
**Where:** `server/src/lib/offers.js`, `client/src/components/OfferDetails.jsx`

![[s34-offer-details.png]]

- When a seller enters a price (on the offer form or in the chat), four optional boxes appear:
  - **Condition**: New · Like new · Good · Fair, each with a one-line meaning;
  - **Warranty**: none, 1, 3 or 6 months, or 1 year;
  - **Returns**: none, or within 3 or 7 days;
  - **Price valid until**: today up to 60 days ahead.
- They show as grey badges under the price in the chat and in Compare offers.
- After the "valid until" day, the price shows **Price expired** and can't be accepted (Counter and Not for me still work).

## 5. Thank-you note to other sellers, and deal problems
**Why:** [[ADR-042 Closing note and deal problems]] · **Build:** [[Step 42 - Closing note and deal problems]]
**Where:** `thankOtherSellers()` in `server/src/lib/notify.js`, `POST /api/deals/:id/problem` in `server/src/routes/ratings.js`, `DealProblem` in `Conversation.jsx`

![[s34-deal-problem.png]]

- When a request is found, closed or closes after 30 days, every seller who made an offer and wasn't picked gets a 🔔 notification: "Sam found what they needed for “…”. Thanks for your offer 🙏" (or "… is closed now"). No push or email, so it stays quiet.
- Under a deal, either side can tap **⚠️ Something went wrong with this deal?**:
  - pick what happened (not as described, no-show, payment, something else);
  - write a few words.
- It goes to the admins as a report on that chat ("Deal problem" with a badge), so they can read that conversation. The other person isn't told.
- One open report per person per deal; after an admin resolves it, you can write again.
