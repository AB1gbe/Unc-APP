---
tags: [build-guide]
date: 2026-11-13
---
# Step 73 - Marketplace layout and light colours

Why: see [[ADR-073 Marketplace layout and light colours]]. Folder `Unc-APP`, branch `claude/vibrant-edison-r9o798`.

## 1. Housing photos (optional, already committed)
Only needed to change the photos. Windows cmd, in `Unc-APP`:
```
set PEXELS_API_KEY=your-key
set ONLY=home-
node scripts/fetch-photos.mjs
```
`ONLY=` (new) downloads just the files starting with that and keeps the other credits. Files: `server/demo-photos/home-*.jpg`; credits in `server/demo-photos/credits.json`.

## 2. Demo data
- `server/src/demo-ads.js`: each housing ad has a photo.
- `server/src/seed.js`: adds a photo to an existing demo ad that has none.
- `cloudflare/start.js`: seeds again when a demo ad that should have a photo has none.

## 3. App (`client/src/`)
- `pages/AdList.jsx`:
  - `AdCard` (square photo, price, title, area; "Looking for" tag on Wanted);
  - grid for For sale and Housing, rows for Jobs;
  - category chips.
- `pages/Board.jsx`: rewritten as "Marketplace":
  - search, section chips, Today's picks;
  - newest jobs as rows;
  - "What Bahrain is looking for";
  - safety strip and shops.
- `pages/ListingDetail.jsx`:
  - a big first photo on ads (`.ad-hero`);
  - "Listed {time} in {place}";
  - For sale replies start with "Hi, is this still available?".
- `server/src/routes/listings.js`: `/api/listings/sections` returns 12 newest per section.
- `styles.css`:
  - the light palette in `:root`;
  - glass tab bar and Help banner made light;
  - new "Marketplace look" block at the end.
- `index.html` and `public/manifest.webmanifest`: theme colour `#ffffff`.
- `locales/ar.js`: 9 new texts.

## 4. Check
- `npm test`;
- `npm run seed` then `npm start`: the home page is white with a photo grid;
- `node e2e/smoke.mjs`, `node e2e/arabic.mjs`, `node e2e/devices.mjs` (with `BASE_URL`).
