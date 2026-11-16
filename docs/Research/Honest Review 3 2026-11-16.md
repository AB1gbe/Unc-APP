---
tags: [research, review]
date: 2026-11-16
---
# Honest Review 3 (after PR #44)

Asked: "give me your no bullshit feedback again". Based on the live site (phone, desktop, Arabic), the API and the page HTML. Follows [[Honest Review 2 2026-11-15]].

## 1. Shared links and Google see nothing (real bug)
- Every page on unc.b1gbe.org has the same title, "Unc — Ask for it. Get offers.", and the old description "Verified shops and finders bring you offers."
- **Ad links shared on WhatsApp show no title, price or photo.** The code exists (`server/src/lib/previews.js`, used in `server/src/app.js`), but on Cloudflare page requests go straight to the static files (`wrangler.jsonc` `run_worker_first` only lists `/api/*` and `/uploads/*`), so it never runs. Broken since the move to Cloudflare (session 79): [[Mistakes and Fixes#M162]].
- `/robots.txt` and `/sitemap.xml` return the app page, so Google has no list of ads.
- Classifieds in Bahrain grow through WhatsApp shares and Google ("used iphone bahrain"), so this matters more than any design change.

## 2. Every ad on the site is fake
- All 30 listings (12 Wanted, 6 For sale, 6 Housing, 6 Jobs) are demo samples. Demo people with real-sounding names carry a green "Verified" badge.
- A visitor today sees a full-looking site with nothing real in it. A launch with this data would mislead; a launch without it is empty.
- The fix is people, not code: post real things (yours, friends', 20–30 shops), then turn the demo off.

## 3. Arabic is the interface, not the content
- In Arabic, every ad title is still English (the demo data is English only).
- Most posts in Bahrain will be in Arabic or mixed. Search must match Arabic spelling variants (أ/ا/إ, ة/ه, ى/ي). Not checked in this review.

## 4. Smaller things
- The first load on a phone showed grey loading cards for a moment (API about 0.3–0.7 s).
- An "open" badge on ads is jargon for buyers.
- The name: "Unc" means nothing in Arabic, and in English slang it means an older man. Worth a thought before printing anything.
- The address `unc.b1gbe.org` is fine for testing, but a real launch needs its own domain.

## 5. Same as last time
- No email provider, no SMS provider and no real users yet (see [[Launch Plan]]).
- After 103 sessions the product is ready enough. More features won't bring the first 100 users.

## Recommended order
1. Fix link previews on Cloudflare, the page titles and wording, plus robots.txt and sitemap.xml.
2. Make sure Arabic search matches spelling variants.
3. Email and SMS providers.
4. Real ads from real people, then remove the demo data.
