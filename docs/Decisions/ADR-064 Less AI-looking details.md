---
tags: [decision, design]
status: accepted
date: 2026-11-11
---
# ADR-064 Less AI-looking details

After [[ADR-063 Smaller corners and back-glow]] the owner said it "still looks like AI". This time the owner **chose** which giveaways to change (all four offered), so the rest of the look stays ([[Mistakes and Fixes#M125]]).

| Giveaway | Options | Chosen | Where |
|---|---|---|---|
| Emoji everywhere | Keep; plain text; **line icons where an icon helps, plain text elsewhere** | Line icons (Phosphor) + plain text | `client/src/components/Icon.jsx`; cards, activity list, live counters, badges, chat, notifications; emoji removed from interface wording in English and Arabic |
| Template wording and sections | Keep; **plain, local wording; How it works as one slim strip** | Rewritten | Banner "Need something? Post it. Bahrain's shops come to you."; `HowItWorks` strip in `Showcase.jsx` |
| Fonts | Fraunces + Inter (very common on AI sites); Archivo (tried in [[ADR-062 Photo-first marketplace look]]); **Readex Pro + IBM Plex Sans (+ Arabic)** | Readex Pro headings, IBM Plex text | Readex Pro is drawn for Arabic and English together; IBM Plex Sans Arabic matches the Latin |
| Boxes and badges | Keep; **fewer frames, plain labels, white prices, straight banner cards** | Fewer | Category = small uppercase label; activity list and "Needs your attention" use dividers; request cards and the banner keep their frames (the owner liked them) |

Also in this session: stronger glow, glow on category tiles, categories as two even rows (8 per row; 4 on phones).

**Revisit when:** the owner wants other pages (Account, chat, admin) to get the same treatment.
