---
tags: [decision, messaging]
status: accepted
date: 2026-10-21
---
# ADR-025 Offer answers in the chat

See [[Social Touches#2. Offer cards: Accept / Counter / Not for me, and quick replies]]. Builds on [[ADR-006 Messaging model]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| What "Accept" does | Closes the request and creates the deal; **a marked message only** | Message | People still need to meet and check the item. Closing would make the chat read-only before they arrange pickup. The buyer confirms with "I found it!", which already creates the deal ([[ADR-015 Ratings]]). |
| Which prices can be answered | Any; **only the newest price, once** | Newest | No confusion about which price was agreed. |
| Counter-offers | Seller only (as before); **either side can put a price on a message** | Either | Buyers negotiate too; the card makes it one tap. |
| Storage | New `offers` table with states; **`messages.kind` + `reply_to`** | Columns | The chat stays one timeline; the answer is just a message. |
| Quick replies | Send immediately; **fill the box** | Fill | People can personalise the text, and nothing gets sent by accident. |

## Revisit when
- Payments or deposits come to Unc → "Accept" could start a checkout.
