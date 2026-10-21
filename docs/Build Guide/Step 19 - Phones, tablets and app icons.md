---
tags: [build-guide, mobile]
step: 19
---
# Step 19 — Phones, tablets and app icons (session 13)

**What/why:** [[Phones and Devices]], [[ADR-019 Phones, tablets and PWA]].

1. `client/index.html`:
   - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`;
   - `theme-color`;
   - `<link rel="manifest" href="/manifest.webmanifest">`;
   - `apple-touch-icon`.
2. `client/public/manifest.webmanifest`:
   - name, `short_name`, `start_url: "/"`, `display: "standalone"`, colours;
   - icons 192, 512 and 512-maskable.
3. Icons. Run this inside `Unc-APP` (it uses Playwright's browser):
   ```
   node scripts/make-icons.mjs
   ```
   It writes `client/public/icons/*.png` ([[Mistakes and Fixes#M50]]).
4. `client/src/components/TabBar.jsx`:
   - links: Home, Browse, + Post, Messages (with the unread count), Account;
   - inline SVG icons;
   - `Layout.jsx` renders it for logged-in members and passes `unread`.
5. `Layout.jsx`: header links that the tab bar already has get the `hide-phone` class.
6. `client/src/styles.css`:
   - `@media (max-width: 899px)`: show `.tabbar`, hide `.hide-phone`, add bottom padding to `main` (`.with-tabbar`), use `env(safe-area-inset-bottom)` ([[Mistakes and Fixes#M51]]).
   - `@media (max-width: 759px)`: one column, smaller padding, search bar in 2 columns, chat `height: calc(100dvh - …)`.
   - `@media (pointer: coarse)`: `min-height: 44px` on buttons, links and inputs.
   - `overflow-wrap: anywhere` on long member text.
7. `e2e/devices.mjs` and the script `"e2e:devices": "node e2e/devices.mjs"` in the root `package.json`:
   - 5 sizes × English/Arabic × the main pages;
   - it fails on sideways scrolling, a top bar taller than 70 px, or touch targets smaller than 40 px.

Check (two command windows, inside `Unc-APP`):
```
npm run seed
npm run build --workspace client
npm start
```
```
npm run e2e:devices
```
