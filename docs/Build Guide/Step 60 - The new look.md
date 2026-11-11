---
tags: [build-guide, design]
step: 60
---
# Step 60: The new look (session 62)

**What/why:** [[Design System#The new look (session 62)]], [[ADR-060 A darker, grown-up look]].

1. Fonts, from the `Unc-APP` folder:
   ```
   npm install --workspace client @fontsource-variable/fraunces @fontsource-variable/inter @fontsource-variable/noto-kufi-arabic
   ```
   Import them at the top of `client/src/main.jsx` (before `./styles.css`).
2. `client/src/styles.css`:
   - replace the tokens in `:root` with the dark ones and `--font-display`; delete the old `prefers-color-scheme` block;
   - `h1, h2, .logo` use `--font-display`; Arabic (`[dir="rtl"]`) uses Noto Kufi Arabic;
   - anything with white text on `--brand` uses `var(--brand-ink)` instead;
   - light hard-coded colours (tips, scam warning, earned badges, answer line) move to `--warn-soft`, `--ok-soft`, etc.;
   - `.hero` gets the dark warm gradient; new blocks at the end: `.hero-stack`, `.how`, `.cat-tiles`, `.help-topics`, `.help-faq-head`, `.help-team`;
   - `.nav .btn, .nav a { white-space: nowrap; }` (see [[Mistakes and Fixes#M116]]).
3. Pictures: `scripts/make-art.mjs` → `node scripts/make-art.mjs` writes `client/public/art/*.jpg`. Demo photos: new colours in `scripts/make-demo-photos.mjs` → `node scripts/make-demo-photos.mjs`.
4. `client/src/art.js` (`categoryArt()`, `art()`); `client/src/components/Showcase.jsx` (`HeroStack`, `HowItWorks`, `CategoryTiles`).
5. `client/src/pages/Browse.jsx`: banner with `HeroStack`, then `HowItWorks` (visitors) and `CategoryTiles` (when no search). `client/src/components/ui.jsx`: `ListingCard` always shows a picture.
6. `client/src/pages/Help.jsx`: banner, topic tiles (`#help-start` …), pictures in each section.
7. Arabic for the new words in `client/src/locales/ar.js`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
