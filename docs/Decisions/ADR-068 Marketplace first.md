---
tags: [decision, design, marketplace]
status: accepted
date: 2026-11-12
---
# ADR-068 Marketplace first

Based on design and functionality recommendations the owner shared (after the screens PDF, [[Step 67 - Screens PDF]]).

| Question | Options | Chosen | Why |
|---|---|---|---|
| Offers on a request, for people other than the buyer | Count only (before); **which shops/finders answered (name, rating, area, reply speed), no prices**; everything incl. prices | Shops, not prices | **The owner chose it.** Shows the marketplace working, while prices stay private so shops can't undercut by peeking. |
| Requests list | Search + category + area; **plus budget, has-offers, condition filters and newest / closing soon / most offers sort** | Full filters | Recommendation "search and filters work together". |
| Item condition | None; **on the request: new, used, either** | Added | "Item and condition" on every listing. Offers already had their own condition. |
| Demo data | Shown like real activity; **flag `sample`: "Sample" label, kept out of live counters and the activity list** | Sample flag | "Don't label sample prices or activity as live." |
| Offer details | Condition, warranty, returns, valid until; **+ stock (in stock / can order) and pickup / delivery** | Added | "Send an offer with price, stock, warranty, and pickup or delivery." |
| Shop's view of its offer | Just "you've made an offer"; **Sent → Seen by the buyer → Accepted / Declined** | Status | "Track whether the buyer has viewed or accepted it." Uses the existing read receipts. |
| Buyer guidance | None; **"What happens when you choose an offer" (4 steps)** | Steps | "Clearly explain what happens when a buyer chooses an offer." |
| Visitors' home | Banner first; **short line → search with category and area → open requests → categories → shops** | Marketplace first | "Make search, filters and open requests the first things people see." |
| Phone request cards | Big photo cards; **compact rows (photo beside the details)** | Rows | "Design mobile as its own marketplace." |
| Green | Prices green; **green only for good signals (verified, Lowest)** | Signals | Recommendation 4. |

**Still to do (from the same recommendations):** withdrawing an offer, "item no longer available", an expired-request view for sellers, Bahraini Dinar instead of US$, and rebuilding the member home with the new components.

**Revisit when:** shops ask to see competitors' prices, or buyers want offers hidden entirely.
