---
tags: [decision, design, shops]
status: accepted
date: 2026-11-11
---
# ADR-065 Shops first, fewer categories, the owner's font

The owner: the How-it-works strip and the 16 categories "flood the main page", "put a focus more on companies rather than individuals", "the hue is too bright", and the font still looked AI-made.

| Question | Options | Chosen | Why |
|---|---|---|---|
| How it works | Strip; **remove** | Removed | The banner already says it; numbered steps are a template pattern. |
| Categories on the front page | 16 tiles; one slim bar (tried, then replaced); **4 tiles + "All categories" → `/categories` with a search bar** | 4 + page | The owner's request. |
| Who comes first | Requests only; **Verified shops right after the banner + a `/shops` page** | Shops first | The owner wants a focus on companies. Shops still contact buyers only inside a request's chat. |
| Sign-up order | Person first; **Business first** | Business first | Same focus. The choice is still the member's. |
| Glow | Strong; **soft (opacity .35, less saturation)** | Soft | "The hue is too bright." |
| Font | Readex Pro + IBM Plex; four samples shown | **A: Plus Jakarta Sans + Almarai** | Picked by the owner from a sample sheet (`docs/attachments/font-choices.png`). |

**Revisit when:** there are many shops (sort by area or category), or the owner wants shop categories/filters on `/shops`.
