---
tags: [decision, admin]
status: accepted
date: 2026-10-22
---
# ADR-044 Owner dashboard

See [[Your Data, Dashboard and Care#2. Owner dashboard]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Where the numbers come from | An analytics service; **our own tables** | Own tables | Free, private, no tracking scripts. |
| Key numbers | Page views; **requests, offers, deals, members, % answered, time to first offer** | Marketplace health | They show whether buyers get answers, which is the whole idea. |
| "Typical" time | Average; **median (the middle value)** | Median | One very slow request doesn't hide that most are fast. |
| "% answered" | All requests; **requests at least a day old** | A day old | Brand-new requests haven't had a fair chance yet. |
| Charts | A chart library; **simple bars in HTML/CSS, one colour, hover + table** | Plain bars | No new dependency; readable on phones; accessible. |
| Ranges | Any dates; **7, 30, 90 days** | 3 choices | Simple. |

**Revisit when:** the data gets big (then work it out once an hour), or the owner wants money numbers (after payments exist).
