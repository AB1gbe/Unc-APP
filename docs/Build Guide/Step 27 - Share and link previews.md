---
tags: [build-guide, sharing]
step: 27
---
# Step 27: Share to WhatsApp and link previews (session 20)

**What/why:** [[Social Touches]], [[ADR-027 Link previews]].

1. `server/src/config.js`: `clientDist: process.env.CLIENT_DIST || <client/dist>`. This lets tests use a stand-in page.
2. `server/src/lib/previews.js`:
   - `previewTags(listing, path)` builds the `og:*` and `twitter:card` tags, using `APP_URL` for absolute addresses and escaping everything;
   - `withPreview(html, listing, path)` adds them before `</head>` and sets `<title>`.
3. `server/src/app.js`:
   - `express.static(clientDist, { index: false, ... })`;
   - the page handler reads `index.html`;
   - for `/requests/:id` it looks up the request: only if it is open and the buyer isn't banned, with the buyer's language and the first photo;
   - it sends `withPreview(...)`.
4. `client/src/components/ShareButton.jsx`:
   - `navigator.share` when available;
   - otherwise a menu with a WhatsApp link (`https://wa.me/?text=` + text + link) and **Copy link** (`navigator.clipboard`, falling back to `prompt`).
   - It is used in the top row of `ListingDetail.jsx` for open requests.
5. Test:
   - `server/test/previews.test.js` sets `CLIENT_DIST` to a temporary folder before loading the app.
6. Try a real preview (optional, needs the app online with `APP_URL` set to its https address): paste a request link into WhatsApp. To inspect the tags locally, run this inside `Unc-APP`, with `npm start` running in another window:
   ```
   curl http://localhost:4000/requests/1
   ```
   Then look for the `og:` lines.
