---
tags: [decision, social, trust]
status: accepted
date: 2026-10-21
---
# ADR-028 "Found it" stories and earned badges

See [[Social Touches#5. "Found it" stories and earned badges]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Who can post a story | Anyone; **only the buyer or the seller of a real deal, once each** | Deal only | No fake stories; ties into the deal flow ([[ADR-015 Ratings]]). |
| Public by default? | Auto-publish a summary; **opt-in form after rating** | Opt-in | It's public; people choose. |
| Moderation | Pre-approval; **post at once, author can delete, admins can hide** | Post + hide | Fast and simple; reports can be added later. |
| Story photos | Private like chat photos; **public folder `uploads/stories`** | Public | The point is to be seen. Chat photos stay private. |
| Badges | Hand-picked; paid; **computed from activity, ratings and deals** | Computed | Trust you can't buy (see the never list in [[Social Marketplace Ideas]]). |
| Thresholds | Higher (10 deals); **5 deals / 3 ratings for Top finder, 3 deals / 2 ratings for Trusted buyer** | Lower | Reachable in a young marketplace. Raise them as Unc grows. |

## Revisit when
- Many stories → add "Report" on stories and a moderation queue.
- Members game badges → raise the thresholds, or count only ratings from different people.
