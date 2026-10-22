---
tags: [decision, sellers]
status: accepted
date: 2026-10-22
---
# ADR-039 Unmet demand board

See [[Privacy, Demand and Trust#2. What people are asking for (unmet demand)]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Who sees it | Everyone; shops only; **verified members** | Verified | Finders (personal accounts) sell too; visitors don't need it. |
| What it shows | The requests themselves; **counts per category + common words** | Counts | It's about what to stock, not a second Browse. |
| Privacy | Show titles; **counts only, words from 2+ requests, categories from 2+ requests** | Counts only | No single person's words or request can be picked out. |
| Time span | 7 days; **30 days**; all time | 30 days | Same as a request's life ([[ADR-037 Expiry and tips]]). |
| Words | AI topics; **simple word counts with a list of filler words (English + Arabic)** | Word counts | Free, quick, easy to explain. Revisit if the words get noisy. |
| Order | By requests; **by "still waiting for an offer"** | Waiting first | That's the gap a shop can fill. |

**Revisit when:** there are thousands of requests a month (then work it out once an hour), or shops ask for price ranges per category.
