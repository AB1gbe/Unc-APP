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

## Session 93 change
The owner: "The design still looks unfinished, the squares look bad, give it 3px rounded or something, but it needs flair, and the size is too big."
- Tiles are now **compact category cards**: a 34px photo with the name beside it, white card, thin border, soft shadow; on a computer they lift slightly and the border turns blue on hover. About a third of the height of the session-92 tiles.
- `--radius` 2px → **3px** everywhere ([[ADR-078 Square corners]]).

## Session 96 change
The owner: "I don't like how the +Sell is sticking so close to the tagline, add a design or style for the tagline", then "Buy and connect near you … the word Buy highlighted … it swipes to Sell, Trade", then "don't highlight the near you".
- Tagline: **"[Buy] and connect near you"**. The first word changes every 2.4 s, **Buy → Sell → Trade**, sliding up, in brand blue on a yellow highlighter stroke (the logo's colours). "near you" is plain. People who turn off animations see "Buy". Screen readers hear "Buy, sell or trade and connect near you" once.
- **Sell** moved from the tagline to beside the search box.
- Arabic: "{اشترِ / بِع / بادِل} وتواصل من حولك".
- Code: `RotatingWord` in `client/src/pages/Board.jsx`; styles `.tagline-mark`, `.rotator`, `.market-search-row` in `client/src/styles.css`.

## Session 97 change
The owner: "make the ad photos on phones shorter". Phone ad photos 4:3 → **16:9** (`.ad-card-photo` in the phone block of `client/src/styles.css`); about a quarter less tall, so the first ad's price and title fit on the first screen.
