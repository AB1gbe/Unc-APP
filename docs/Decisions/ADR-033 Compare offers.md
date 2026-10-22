---
tags: [decision, offers]
status: accepted
date: 2026-10-22
---
# ADR-033 Compare offers side by side

See [[Choosing, Alerts and Safety#1. Compare offers side by side]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Layout | A table (too wide for phones); **cards in a grid that reflows** | Cards | The same layout works on a phone and a laptop. |
| Which price | The first offer; **the seller's latest price, or the agreed price after an accept** | Latest / agreed | Prices change during a chat; show where things stand now. |
| Where | A new page; **the bottom of the buyer's own request page, from 2 offers** | On the request | The decision happens there, and one offer needs no comparing. |
| Who sees it | Everyone; **only the buyer** | Buyer | Sellers must not see each other's offers. |
| Data | Several API calls per card; **one extra `compare` object per conversation in the existing list** | One call | Fast, and it reuses the owner-only endpoint. |

## Revisit when
- Offers get structured fields (delivery, warranty) → add them as rows on the cards.
