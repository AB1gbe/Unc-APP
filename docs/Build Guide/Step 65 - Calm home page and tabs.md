---
tags: [build-guide, design, navigation]
step: 65
---
# Step 65: Example requests, calm home page and tabs (session 72)

**What/why:** [[ADR-066 Calm home page and tabs]].

1. **Example requests:** `server/src/demo-requests.js` holds `DEMO_BUYERS` (Fatima, Hussain, Noor) and `DEMO_REQUESTS` (30 rows: title, description, category, budget, area, days ago, photo, Pexels search words, Pexels id). `server/src/seed.js` creates the buyers (with a test card) and inserts each request once, with its photo, inside `seedDemo` just before `addDemoPhotos(db)`. Photos: `scripts/fetch-photos.mjs` reads the same list (`req-*.jpg` in `server/demo-photos/`). Test: `server/test/demo-photos.test.js` checks every category has an open demo request.
2. **Calm home:** `client/src/pages/Landing.jsx` (visitors' `/`, set in `HomeOrBrowse` in `client/src/App.jsx`): hero + `HeroStack`, `ShopsPreview`, `CategoryPreview`, 3 newest requests.
3. **Requests tab:** `client/src/pages/Browse.jsx` (`/browse`): page head "Requests", live counters, search, all requests, then the activity list (`Feed`).
4. **Shops tab:** `client/src/pages/Shops.jsx` also shows `StoriesStrip`.
5. **Member home:** `client/src/pages/Home.jsx` without `Feed` and `StoriesStrip`.
6. **Tabs:** `client/src/components/Layout.jsx` top bar: Home, Requests, Shops, Categories (+ My requests, Messages, 🔔, Account for members); Log out removed (it's on Account). `client/src/components/TabBar.jsx`: visitors get Home, Requests, Shops, Categories; members Home, Requests, Post, Messages, Account. `<main>` always has `with-tabbar` padding.
7. **Demand page:** word labels use `.word-tag` (not `.chip`, which is a button style) ([[Mistakes and Fixes#M129]]).
8. Tests: `e2e/smoke.mjs` looks for stories on `/shops`, the activity list on `/browse`, and the visitor tab bar on phones.

Check: `npm test` (188), `npm run e2e`, `npm run e2e:ar`, `npm run seed` + `npm start` + `npm run e2e:devices`.
