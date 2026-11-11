---
tags: [decision, design]
status: accepted
date: 2026-11-11
---
# ADR-063 Smaller corners and back-glow

Follows [[ADR-062 Photo-first marketplace look]] (reverted). The owner liked the session 62–64 look but found rounded photos "AI-like", then asked for "backhue lighting".

| Question | Options | Chosen | Why |
|---|---|---|---|
| Overall look | Square photo-first redesign; **the session 62–64 look** | Previous look | The owner said the redesign looked worse. |
| Corners | 18 px; **6 px on cards and tiles, 8 px on the banner**; 0 | 6 px | Keeps the look the owner liked, without the very round "AI" corners. |
| "Backhue lighting" | Coloured shadow in one brand colour; **a blurred copy of each photo behind its card** | Photo glow | Each card glows in its own photo's colours, like TV ambient backlighting; brighter on hover. |
| Where | Everywhere; **request cards, banner cards, How Unc works** | Those three | Category tiles scroll sideways, which would clip the glow. |

**Revisit when:** the glow costs too much on slow phones (it uses a blur filter per card), or the owner wants it on more places.
