---
tags: [decision]
date: 2026-11-16
status: accepted
---
# ADR-083 Search and link previews

## Context
[[Honest Review 3 2026-11-16]]:
- shared ad links showed nothing on WhatsApp (M162);
- Google had no titles or sitemap;
- search matched only the exact phrase, so Arabic spelling variants and words in another order were missed.

## Options
| Question | Options | Chosen |
|---|---|---|
| Link previews on Cloudflare | (a) worker sends ad/section pages to the server and fills the tags in; (b) pre-render pages at build time; (c) send every page through the server | **(a)**: only pages that need tags pass through the worker; scripts and images stay static and fast |
| Arabic search | (a) normalise in SQL with `replace()` at search time; (b) a stored, normalised search column; (c) SQLite full-text search (FTS5) | **(a)**: no migration or back-fill, works the same on Node and Cloudflare; fine for thousands of ads |
| Arabic ↔ English words | (a) a small list of twins (ايفون ↔ iphone…); (b) none; (c) machine translation | **(a)**: covers the words people type most, costs nothing |
| Google on the test site | open or closed | **Closed**: `robots.txt` says `Disallow: /` while `TEST_SITE=1`; a real site gets a sitemap |

## Decision
- **Pages:** `cloudflare/worker.js` handles `/`, `/requests/<id>`, `/for-sale`, `/housing`, `/jobs`, `/browse`, `/shops`. It takes `index.html` from the static files and asks `/api/page-meta?path=…`. `shared/page-meta.js` `applyMeta()` puts in the title, description and tags.
- **Search:** every word must match (title, description, area or category). Arabic letters, short vowels and digits are normalised (`shared/search.js`). There is a short twin-word list.

## Revisit when
- More than ~50,000 open ads, or search feels slow: switch to a stored search column or FTS5.
- People search for words missing from the twin list: add them.
- At launch on a real domain: remove `TEST_SITE`, so `robots.txt` opens up and the sitemap is used.
