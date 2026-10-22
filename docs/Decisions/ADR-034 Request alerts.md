---
tags: [decision, notifications]
status: accepted
date: 2026-10-22
---
# ADR-034 Request alerts for sellers

See [[Choosing, Alerts and Safety#2. Request alerts for sellers]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Fields | Free search only; **words + category + city/governorate + minimum budget, any combination** | Combined | Covers how sellers think ("Electronics in Manama worth my time"). |
| Words | Any word; **all words must appear** | All | Fewer false alarms. |
| Budget | Ignore; **the buyer's top budget must reach the minimum; requests without a budget still match** | As described | Sellers skip tiny requests without missing open-ended ones. |
| Delivery | Instant 🔔 + push; a daily email digest | **Instant** (digest later) | Speed wins offers; a digest is a separate idea ([[More Ideas for the Vision]]). |
| Duplicates | Notify for every reason; **one notification per member per request** (favourite heads-up first) | One | No double buzzing. |
| Limit | Unlimited; **10 per member** | 10 | Enough for real use; stops abuse. |
| Matching cost | Index on words; **look up alerts by category (indexed), check the rest in code** | Category index | Fine at Unc's size. Revisit with thousands of alerts. |
