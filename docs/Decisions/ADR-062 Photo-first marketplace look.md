---
tags: [decision, design]
status: accepted
date: 2026-11-11
---
# ADR-062 Photo-first marketplace look

Replaces parts of [[ADR-060 A darker, grown-up look]] (dark theme and coral stay). Research: [[Marketplace Design Study]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Corners | Rounded 18 px (session 62); **square: photos 0, boxes and buttons 2 px** | Square | Rounded everything is a known "AI" tell; marketplaces use square photos. Avatars stay round. |
| Request cards | Boxed card with photo inside; **photo then plain text, no box** | No box | Grailed/Depop/Vinted: the photo is the card. |
| Banner | Gradient box with tilted cards; **plain text + straight photo grid** | Plain | No gradients or decorative tilt. |
| Fonts | Fraunces + Inter; **Archivo only** (wide, heavy headings) | Archivo | One deliberate grotesk; Inter-everywhere reads as AI. |
| Price colour | Green; **white** | White | Coral stays for actions only. |
| Request page without a photo | Text only; **category photo, captioned "Example picture"** | Example photo | Never a wall of text, and honest that it isn't the buyer's photo. |

**Revisit when:** the remaining boxed parts (feed, Account) are redesigned, or members' own photos fill the front page.
