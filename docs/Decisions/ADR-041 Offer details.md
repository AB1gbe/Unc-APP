---
tags: [decision, choosing]
status: accepted
date: 2026-10-22
---
# ADR-041 Offer details

See [[Privacy, Demand and Trust#4. Offer details: condition, warranty, returns, valid until]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Format | Free text; **fixed choices** | Fixed choices | Comparable across sellers, translated, shown as badges. |
| Condition words | Many grades; **New, Like new, Good, Fair, each with a meaning** | 4 words | A shared meaning means fewer arguments at pickup. |
| Warranty / returns | Any number of days; **a few common choices** | Choices | Simple, and close to what shops usually give. |
| Valid until | None; **an optional date, up to 60 days** | Optional date | Honest for shops whose prices change; adds gentle urgency. |
| After that date | Hide the offer; **show "Price expired" and block Accept** | Block Accept | The chat history stays; Counter still works. |
| Who can add them | Both sides; **the seller, with a price** | Seller | The details describe what the seller offers. |

**Revisit when:** a category needs its own fields (e.g. cars: mileage).
