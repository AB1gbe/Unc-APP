---
tags: [feature]
date: 2026-11-16
---
# Search

Why: [[ADR-083 Search and link previews]].

## What members get
- **Every word counts, in any order:**
  - "purple iphone" finds "iPhone 14 Pro, deep purple";
  - "purple samsung" does not.
- **Arabic spellings match:**
  - أ إ آ ا are the same letter, and so are ة/ه, ى/ي, ؤ/و and ئ/ي;
  - short-vowel marks and ـ are ignored;
  - Arabic digits ٠–٩ match 0–9.
  - So "ايفون" finds "آيفون" and "شقه مفروشه" finds "شقة مفروشة".
- **"The" in Arabic:** "الايفون" also looks for "ايفون".
- **English and Arabic twins:** for example ايفون ↔ iphone, سامسونج ↔ samsung, شقه ↔ flat, طاوله ↔ table, سياره ↔ car. The list is `TWINS` in `shared/search.js`; add words there.
- **Fields searched:** title, description, area and category.
- **Special characters:** % and _ are plain characters.

## How it works
- `shared/search.js`:
  - `normalizeSearch()` changes the search words in JavaScript;
  - `sqlNormalize()` makes the same change as nested SQL `replace()` on the ads;
  - `searchTerms()` splits the search into at most 6 words, each with its alternatives.
- `server/src/routes/listings.js` `GET /api/listings?q=` adds one `LIKE` group per word.
- Tests: `server/test/search.test.js`.

## Limits
- Every search reads every open ad in the section. That is fine for thousands of ads; above ~50,000, switch to a stored column or full-text search (see the ADR).
