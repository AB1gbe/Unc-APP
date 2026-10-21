---
tags: [decision, ratings]
status: accepted
date: 2026-10-21
---
# ADR-015 Ratings: deal-based, two-way, blind

## Options considered
| Question | Options | Chosen | Why |
|---|---|---|---|
| Who can rate? | Anyone who chatted; anyone; **only the two sides of a recorded deal** | Deal only | Chatting ≠ trading; prevents revenge/fake reviews from people who never bought |
| How is a deal recorded? | Vendor clicks "sold"; both confirm; **buyer picks the seller when marking fulfilled** | Buyer picks | Reuses the existing "mark fulfilled" step; one click; the buyer is the one who knows |
| Direction | Buyers rate sellers only; **both rate each other** | Both | Sellers also want to know reliable buyers (no-shows) |
| Scale | Thumbs up/down; **1–5 stars + optional comment**; multiple categories | 1–5 stars | Familiar, simple (MUST #2) |
| Timing | Visible immediately; **blind until both rate or 14 days** | Blind | Removes retaliation (the Airbnb approach) |
| Editing | Editable; **final** | Final | Stops pressure to change reviews |
| Rating window | Forever; **30 days** | 30 days | Reviews stay relevant |
| Storage of averages | Cached columns on `users`; **computed with an index** | Computed | Always correct, nothing to keep in sync; `idx_ratings_ratee` makes it fast |
| Profile page | None; **public profile without contact options** | Profile | Trust signal; contact still only via a request (MUST #3) |

## Revisit when
- Fake deals appear (two accounts dealing with each other to boost ratings) → require the seller to confirm the deal, or weight ratings by account age.
- Members ask to reply to reviews → add a one-time public reply.
