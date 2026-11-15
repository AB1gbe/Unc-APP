---
tags: [decision, design]
status: accepted
date: 2026-11-15
---
# ADR-079 Tagline, featured tiles, one ad per row

The owner (screenshots of the live home page, a description of Craigslist, and the Siin app's category row):
1. "Apply the featured categories up top like the third image" (Siin: coloured tiles with a picture, scrolling sideways).
2. "Give each offer a single row, don't cram two offers in one row."
3. "The first thing people should see is a tagline that makes them understand what the app is about: 'buy, sell, trade, and connect with people in their immediate geographic area'. You can rephrase it."

| Question | Options | Chosen | Why |
|---|---|---|---|
| Tagline | Craigslist's sentence as is; **shorter, local** | **"Buy, sell and connect with people near you"** + "Things for sale, homes, jobs and requests across Bahrain. Every member is ID-checked." | Says what Unc is and why it's safe, in one glance; replaces the word "Marketplace". |
| Featured categories | Section chips (before); **coloured photo tiles, sideways scroll** | Tiles: Phones, Homes for rent, Cars & parts, Jobs, Furniture, Electronics, Fashion, Sports, Wanted | Like Siin. Colours avoid red and green (they mean bad/good, [[ADR-076 Colours that mean something]]). Our photos are scenes, not cut-outs, so the picture fades into the tile colour (a CSS mask) to get the "object on a glow" look. Square corners kept ([[ADR-078 Square corners]]). |
| Ads on phones | 2 per row; **1 per row** | 1 per row, photo 4:3 | Bigger, easier to read and tap. Computers keep the grid. |
| Category chips on lists | Wrap onto many lines; **one line that scrolls** | Scroll (`.chips.scroll`) | On phones they took six lines. Interest chips on profiles still wrap. |

**Revisit when:** real cut-out product pictures exist for the tiles.

## Session 92 change
The owner (screenshot of the live page): "The tiles still look too AI, make them look real; they also look huge; the text is too much, just a tagline."
- Tiles: **plain small square photos (76px, 68px on phones) with the name underneath**, thin border, no colour glow or fading mask, like a real shop's category row.
- Text: only the tagline "Buy, sell and connect with people near you", smaller (1.2rem); the second sentence is removed.
