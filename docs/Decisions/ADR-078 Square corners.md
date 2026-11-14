---
tags: [decision, design]
status: accepted
date: 2026-11-14
---
# ADR-078 Square corners

The owner (phone screenshot of the home page): **"This rounded look gives it more of an AI look, it needs to change."** (Same feeling as session 70, [[Mistakes and Fixes#M125]]: rounded images read as AI-made.)

| Option | Chosen |
|---|---|
| Keep 6–8px corners and pill (fully round) buttons/chips | |
| **Nearly square: one 2px corner everywhere, photos fully square, no pills** | ✅ |
| Fully square (0px) everywhere | (too harsh on buttons and inputs) |

Kept round: profile pictures, small count dots, the logo tile (chosen in [[ADR-075 Logo]]).

How: `--radius: 2px` in `client/src/styles.css`; every `border-radius` (6px, 8px, 10px, 16px, 22px, 999px…) now uses `var(--radius)` (69 places), except circles (`50%`); photos get `border-radius: 0` (block "Square photos" at the end of the file).

Also fixed: on phones a tapped card stayed underlined (sticky hover): cards are never underlined, and the hover colour/zoom only applies on devices with a mouse (`@media (hover: none)`).

**Revisit when:** a designer defines the brand's shapes.
