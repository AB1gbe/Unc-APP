---
tags: [decision, ux]
status: accepted
date: 2026-10-21
---
# ADR-024 Warm wording and celebrations

See [[Social Touches#1. Warmer wording, greetings, celebrations, loading placeholders]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Confetti | A library (canvas-confetti, ~6 KB); **~40 lines on a canvas** | Own code | No dependency; easy to read and change. |
| Reduced motion | Always animate; **respect `prefers-reduced-motion`** | Respect | Some people get motion sickness; they still see the message. |
| Seasonal dates (Ramadan, Eid) | A table of dates per year; **`Intl` Umm al-Qura calendar** | Calendar | Never needs updating; the same calendar Saudi Arabia and Bahrain use for official dates. Revisit if the moon-sighting date differs by a day from the official one; then add an override. |
| Loading | "Loading…" text; spinner; **grey placeholder shapes** | Placeholders | The page feels faster, and the layout doesn't jump. |
| Toast position | Top; **bottom centre, above the tab bar, not clickable** | Bottom | Thumb area on phones; `pointer-events: none` so it never blocks a button ([[Mistakes and Fixes#M67]]). |

## Revisit when
- Members say it's too much → add a "fewer animations" switch in Account.
