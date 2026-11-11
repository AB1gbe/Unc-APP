---
tags: [build-guide, design]
step: 62
---
# Step 62: Photo-first marketplace look (session 68)

**What/why:** [[ADR-062 Photo-first marketplace look]], [[Marketplace Design Study]].

1. Fonts (inside `Unc-APP`):
   ```
   npm install --workspace client @fontsource-variable/archivo
   npm uninstall --workspace client @fontsource-variable/fraunces @fontsource-variable/inter
   ```
   In `client/src/main.jsx`: `import '@fontsource-variable/archivo/wdth.css';` (with the width axis).
2. `client/src/styles.css`:
   - tokens: `--radius: 2px`, `--shadow: none`, `--font-display` and the body font = Archivo; `h1, h2` weight 800, `font-stretch: 112%`;
   - every `border-radius` of 6–24 px and `999px` → `var(--radius)` (circles at `50%` stay);
   - `.hero`: no background or border, only a line under it;
   - the "Session 68" block at the end: `.hero-photos`, `.section-title`, `.listing-card` / `.listing-photo` / `.listing-meta`, `.gallery-fallback`, `.how`, `.cat-tiles`, `.help-*`. Photos use `height: auto` with `aspect-ratio` (see [[Mistakes and Fixes#M124]]).
3. `client/src/components/ui.jsx`: new `ListingCard` (class `listing-card`, photo first).
4. `client/src/components/Showcase.jsx`: `HeroPhotos` (4 photos, or 2 when there are fewer than 4 requests) replaces `HeroStack`; section titles get `className="section-title"`.
5. `client/src/pages/ListingDetail.jsx`: `.gallery-fallback` with the category photo and the caption; meta without emoji. `client/src/pages/Home.jsx`: status badge inside the photo.
6. Arabic in `client/src/locales/ar.js` ("Example picture…", `{n} views`).
7. Tests: in `e2e/smoke.mjs` and `e2e/arabic.mjs`, request cards are `.listing-card` ([[Mistakes and Fixes#M122]]).

Check: `npm test`, `npm run e2e`, `npm run e2e:ar`, `npm run seed` + `npm start` + `npm run e2e:devices`.
