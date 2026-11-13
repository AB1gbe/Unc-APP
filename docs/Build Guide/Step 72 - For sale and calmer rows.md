---
tags: [build-guide]
date: 2026-11-13
---
# Step 72 - For sale and calmer rows

Why: the owner asked for a For sale section and calmer listings. See [[ADR-072 For sale section and calmer ad rows]].

Folder: `Unc-APP` (top folder), branch `claude/vibrant-edison-r9o798`.

## 1. Database: migration 43 (`server/src/db.js`)
```sql
ALTER TABLE listings ADD COLUMN section_new TEXT NOT NULL DEFAULT 'wanted' CHECK (section_new IN ('wanted','housing','jobs','forsale'));
UPDATE listings SET section_new = section;
DROP INDEX idx_listings_section;
ALTER TABLE listings DROP COLUMN section;
ALTER TABLE listings RENAME COLUMN section_new TO section;
CREATE INDEX idx_listings_section ON listings(section, status, created_at);
```
- `MIGRATION_SQL` is exported for the migration test.

## 2. Server
- `lib/categories.js`: `SECTIONS` adds `forsale`.
- `app.js`: `/api/meta` `sections.forsale` = the 16 categories.
- `routes/listings.js` `readListingBody()`: `forsale` needs `price` (stored in `budget_min` = `budget_max`) and `condition` `new`/`used`.
- `shared/scam-check.js`: also checks For sale ads; adds "ships from abroad after payment" as a hold.
- Demo data:
  - `demo-ads.js` + `seed.js`: 6 For sale demo ads with photos from `server/demo-photos/`;
  - `cloudflare/start.js` seeds again once when the newest demo ad is missing (so the live site gets them).

## 3. App (`client/src/`)
- `sections.js`: `forsale` label, path `/for-sale`, `SECTION_ICON`.
- `pages/AdList.jsx`:
  - `AdRow` redesigned;
  - new `SampleNote`;
  - For sale texts and filters.
- `pages/Board.jsx`: 4 sections, newest 5 each.
- `pages/NewListing.jsx`: price and condition.
- `pages/ListingDetail.jsx`: condition fact, Sold button, For sale reply text.
- `App.jsx`: the `/for-sale` route.
- `SideNav.jsx`, `TabBar.jsx`, `Icon.jsx` (Tag).
- `styles.css`: `.ad-row`, `.ad-thumb`, `.ad-meta` and the board rules.
- `locales/ar.js`: 15 new texts.

## 4. Checks
```
npm test
npm run seed
npm start
```
- Open `/for-sale`: 6 sample items with photos.
- Open `/` on a phone-sized window: 2×2 section boxes, then calm rows.
- Tests:
  - `server/test/sections.test.js`: For sale rules, and migration 43 keeping chats and photos;
  - `e2e/smoke.mjs`: posts and answers a For sale ad;
  - Arabic and device checks: 25 pages.
