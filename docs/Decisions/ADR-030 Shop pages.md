---
tags: [decision, shops]
status: accepted
date: 2026-10-21
---
# ADR-030 Shop pages

Context: "build the shop pages next", from [[Social Marketplace Ideas]]. See [[Shop Pages]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Separate page or the profile? | A new `/shops/:id` page; **the business member's profile becomes the shop page** | Profile | One address per member; ratings, stories and badges are already there. |
| Contact details | Phone / WhatsApp / website fields; **none, and refuse them in free text** | None + guard | The MUST: contact only through a request. Without the guard, a bio like "WhatsApp 3912 3456" would bypass it. |
| Location | Exact address with an embedded map (needs a Maps API key and allows walk-ins that skip the request); **area text + a "Map ↗" search link** | Area + link | Enough to judge distance; no API key; no new outside service on the page. |
| Opening hours format | Free text ("9–9 daily"); **7 structured days with times, past midnight allowed** | Structured | Lets the page say "Open now", in both languages. |
| "Open now" time zone | Store a time zone per shop; **use the visitor's clock** | Visitor's clock | Unc serves one country, so shop and buyer share a time zone. Revisit if it expands across time zones. |
| Phone layout | Keep the 3-column header; **wrap: smaller photo, rating below** | Wrap | The name had broken mid-word ([[Mistakes and Fixes#M75]]). |

## Revisit when
- Expanding beyond Bahrain → store a time zone per shop.
- Shops ask for a gallery of products → reuse the story photo pattern.
- Members find ways around the guard (spelled-out numbers) → add reporting of profiles.
