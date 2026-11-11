---
tags: [build-guide, shops, design]
step: 64
---
# Step 64: Shops first, fewer categories, new font (session 72)

**What/why:** [[ADR-065 Shops first and fewer categories]].

Inside `Unc-APP` (Windows cmd):
```
npm install --workspace client @fontsource-variable/plus-jakarta-sans @fontsource/almarai
npm uninstall --workspace client @fontsource-variable/readex-pro @fontsource/ibm-plex-sans @fontsource/ibm-plex-sans-arabic
```

1. **Server:** `server/src/routes/shops.js` → `GET /api/shops?q=&limit=` (verified, non-banned, not deleted business accounts; most sales first; search in name, area and bio; no email or ID data). Mounted in `server/src/app.js` with `app.use('/api', shopRoutes(db))`. Test: `server/test/shops.test.js`.
2. **Demo data:** `server/src/seed.js` adds three shops (`furniture@`, `autoparts@`, `phonefix@demo.local`, password `Password123`) with area, hours, bio and photos. Photos: new entries in `scripts/fetch-photos.mjs` (Pexels ids fixed). `server/test/demo-photos.test.js` expects 6 demo avatars and 4 shop covers.
3. **Client:**
   - `client/src/components/Showcase.jsx`: `ShopCard`, `ShopsPreview` (4 shops), `CategoryTile`, `CategoryPreview` (`FEATURED_CATEGORIES` = Electronics, Phones & Tablets, Home & Furniture, Vehicles & Parts + "All categories" tile). `HowItWorks` and the category bar are gone.
   - `client/src/pages/Browse.jsx`: banner → Verified shops → Browse by category → stories → activity → search → requests.
   - New pages `client/src/pages/Categories.jsx` (`/categories`) and `client/src/pages/Shops.jsx` (`/shops`), routes in `client/src/App.jsx`; both use `.searchbar.searchbar-simple`.
   - `client/src/pages/Register.jsx`: "A business" listed first.
   - Glow in `client/src/styles.css`: `opacity: .35`, `saturate(1.3)` (hover `.55`; banner `.45`).
   - Fonts: imports at the top of `client/src/main.jsx` (Jakarta + Almarai Arabic 400/700/800); `--font-display` and body font = Plus Jakarta Sans; `[dir="rtl"]` = Almarai.
   - Arabic for all new words in `client/src/locales/ar.js`.
4. `e2e/devices.mjs`: `/categories` and `/shops` added (19 pages).

Check: `npm test` (188), `npm run e2e`, `npm run e2e:ar`, `npm run seed` + `npm start` + `npm run e2e:devices`.
