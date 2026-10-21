---
tags: [build-guide, ux]
step: 24
---
# Step 24: Warm wording, greetings, celebrations, loading placeholders (session 20)

**What/why:** [[Social Touches]], [[ADR-024 Warm wording and celebrations]]. No server changes.

1. `client/src/seasons.js` (no imports, so the server tests can load it):
   - `partOfDay(date)`: morning 5–12, afternoon 12–17, evening otherwise.
   - `hijri(date)` uses `new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { month: 'numeric', day: 'numeric' })`.
   - `season(date)`: Hijri month 9 is `ramadan`; 10/1–3 is `eid-fitr`; 12/10–13 is `eid-adha`; 16–17 December is `national-day`.
2. `client/src/components/Celebrate.jsx`:
   - `celebrate({ text, confetti })` fires the window event `unc:celebrate`.
   - `<Celebrations />` (put it in `Layout.jsx`) shows `.toast` for 3.5 s and draws confetti on a `<canvas class="confetti">`, unless `prefers-reduced-motion` is on.
3. Call `celebrate()` from:
   - `NewListing.jsx` (posted);
   - `ListingDetail.jsx` (offer sent; found);
   - `Conversation.jsx` (rated).
4. `client/src/components/ui.jsx`: `Loading` becomes grey `.sk-line` shapes with a hidden "Loading…" for screen readers. `CardsLoading` is used for grids in Home, Browse and Saved.
5. `Home.jsx`: the greeting and season objects are written as literal `tj('Good morning, {name}', v)` calls, so the translation test can see them ([[Mistakes and Fixes#M66]]).
6. Wording changes: rename the English key in the page **and** in `client/src/locales/ar.js` together ([[Mistakes and Fixes#M65]]).
7. CSS: `.visually-hidden`, `.skeleton`, `.sk-line`, `.sk-photo`, `.toast` (with `pointer-events: none`), `.confetti`.
8. Test: `server/test/seasons.test.js`.
