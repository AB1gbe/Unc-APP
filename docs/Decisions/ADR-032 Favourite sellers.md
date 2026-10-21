---
tags: [decision, social]
status: accepted
date: 2026-10-21
---
# ADR-032 Favourite sellers

Context: "build the favourite sellers next", from [[Social Marketplace Ideas]]. See [[Social Touches#7. Favourite sellers (session 28)]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| What a favourite does | Lets you message the seller directly; **tells them first when you post in their categories** | Heads-up only | Direct messages would break the MUST. The heads-up brings them to the request, where contact is allowed. |
| Which favourites hear about a request | All of them; **those whose interests include the category, or who chose no interests** | Matching | Sellers only get requests they can answer. |
| How they hear | In-app only; **🔔 notification + phone push** | Both | "Hear first" only works if it reaches them; pushes go only to people who turned them on. |
| Who can be favourited | Anyone; only people you dealt with; **any verified, non-banned member except yourself** | Verified | A shop you like from browsing counts too; unverified members can't make offers anyway. |
| Shown publicly | Who favourited whom; **only a count** | Count | Social proof without exposing anyone's list. |
| Where | A new page; **the Saved page** | Saved | "Things I like" in one place. |

## Revisit when
- A buyer posts many requests in a day → bundle the heads-ups ("Mona posted 3 requests").
- Sellers want to know who favourited them → probably still no, for privacy.
