---
tags: [decision, social]
status: accepted
date: 2026-11-08
---
# ADR-055 Live counters and "Closes in N days"

Ideas 1 and 2 from [[Siin Competitor Study#9. Ideas worth borrowing (fit Unc's rules)]], asked for in [[2026-11-08 Session 56]]. See [[Social Touches#8. Live counters and "Closes in N days" (session 56)]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| What to count | Made-up or rounded-up "busy" numbers; **real counts** | Real | Unc's trust promise; fake activity is on the "never" list ([[Social Marketplace Ideas]]). |
| Which numbers | Total members; **active now (15 min), requests and offers in the last 24 h** | Recent activity | Shows the place is alive today; totals don't. |
| "Today" | Since midnight; **last 24 hours** | 24 hours | Same meaning in every time zone; never shows 0 just after midnight. |
| Zero | Show "0"; **hide zeros (and the strip when all are 0)** | Hide | A row of zeros makes a new marketplace look empty. |
| Cost | Count on every page view; **cache for a minute + indexes (migration 34)** | Cache | Cheap even with many visitors. |
| Closing badge window | Always; **last 3 days** | 3 days | It means something when it appears. |
| Rounding | Down; **to the nearest day ("today" under 24 h)** | Nearest | Rounding down showed "1 day" with almost 2 days left ([[Mistakes and Fixes#M106]]). |

**Revisit when:** the numbers get big enough to show per area ("12 requests in Riffa today"), or members find the counters noisy.
