---
tags: [build-guide]
date: 2026-11-16
---
# Step 78 - Search and link previews

Why: [[ADR-083 Search and link previews]].
- Folder `Unc-APP`, branch `claude/vibrant-edison-r9o798`.
- No database change.

## Link previews and page titles
1. `shared/page-meta.js`: `applyMeta(html, {title, description, tags})`.
2. `server/src/lib/previews.js`: `pageMeta(listing, path)`. It handles each section's wording, single price, "/ month", a description snippet, the canonical link, and section page titles.
3. `server/src/app.js`:
   - `GET /api/page-meta`, `/robots.txt`, `/sitemap.xml`;
   - the Node page handler uses the same `previewFor()`.
4. `cloudflare/worker.js`: pages matching `META_PAGE` are built from `index.html` plus `/api/page-meta`. `robots.txt` and `sitemap.xml` go to the server.
5. `wrangler.jsonc` `run_worker_first`: added `/`, `/requests/*`, `/for-sale`, `/housing`, `/jobs`, `/browse`, `/shops`, `/robots.txt`, `/sitemap.xml`.
6. `client/index.html`: new default title and description (no more "finders").
7. Tests: 3 new in `server/test/previews.test.js`.

## Search
1. `shared/search.js` (see [[Search]]).
2. `server/src/routes/listings.js`: `SEARCH_TEXT` and the `q` filter.
3. Tests: `server/test/search.test.js` (5; 4 fail on the old code).

## Check (Windows cmd, in `Unc-APP`)
```
npm test
```
242 should pass.

Cloudflare check (optional, it shows the real hosting set-up):
```
npm run build --workspace client
npx wrangler dev --port 8832
```
Then, in a second window:
```
curl http://localhost:8832/requests/1
```
The result should contain `og:title` with the ad's title, and `curl http://localhost:8832/robots.txt` should print `Disallow: /`.

After merging, check the live site:
```
curl https://unc.b1gbe.org/requests/<id>
```
