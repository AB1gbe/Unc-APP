---
tags: [build-guide, design]
step: 63
---
# Step 63: Less AI-looking details (session 70)

**What/why:** [[ADR-064 Less AI-looking details]].

Inside `Unc-APP` (Windows cmd):
```
npm install --workspace client @phosphor-icons/react @fontsource-variable/readex-pro @fontsource/ibm-plex-sans @fontsource/ibm-plex-sans-arabic
npm uninstall --workspace client @fontsource-variable/fraunces @fontsource-variable/inter @fontsource-variable/noto-kufi-arabic @fontsource-variable/archivo
```

1. **Glow** (`client/src/styles.css`, block "Back-glow"): blur 44px, saturate 2.2, brightness 1.3, opacity .85 (1 on hover); glow box 116% × 86%. Category tiles: each tile in a `.glow-wrap` (`CategoryTiles` in `client/src/components/Showcase.jsx`); `.cat-tiles` is a grid `repeat(8, minmax(0, 1fr))`, 4 columns under 900px. `html, body { overflow-x: clip; }` so the glow never makes the page scroll sideways.
2. **Emoji → icons:** `client/src/components/Icon.jsx` (`<Icon name="pin" />` etc.). A script removed emoji at the start, end and middle of `t()` wording in `client/src` and the matching keys/values in `client/src/locales/ar.js` (check afterwards: `node --test server/test/i18n-coverage.test.js` finds missing or duplicate keys). Browser tests updated where the wording changed (`Received`, `Saved`, `What people are asking for`).
3. **Wording:** banner title/text/button in `client/src/pages/Browse.jsx`; story subtitle in `client/src/components/Stories.jsx`; `HowItWorks` → `.how-strip` (three items with 56px photos); Arabic in `ar.js` ("Session 69: plainer, local wording").
4. **Fonts:** imports at the top of `client/src/main.jsx`; `--font-display` = Readex Pro; body font IBM Plex Sans; `[dir="rtl"]` uses IBM Plex Sans Arabic.
5. **Boxes and badges:** `.cat-label` instead of `.badge` for categories (`ui.jsx`, `ListingDetail.jsx`); `.price` white; `Feed.jsx` and the attention list in `Home.jsx` without `.card`; `.hero-card-0/1` without rotation.

Check: `npm test`, `npm run e2e`, `npm run e2e:ar`, `npm run seed` + `npm start` + `npm run e2e:devices`.
