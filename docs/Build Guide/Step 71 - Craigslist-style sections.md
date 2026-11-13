---
tags: [build-guide]
date: 2026-11-13
---
# Step 71 - Craigslist-style sections

Why: the owner wants Unc to work like Craigslist, with safety. See [[ADR-071 Craigslist-style sections]] and [[Housing, Jobs and Wanted]].

Folder: `Unc-APP` (top folder), branch `claude/vibrant-edison-r9o798`.

## 1. Database (migration 42, `server/src/db.js`)
Appended to `MIGRATIONS`:
- `listings.section` (`wanted`/`housing`/`jobs`, default `wanted`);
- `bedrooms`, `furnished`, `job_type`;
- `held_at`, `held_reason`, `checked_at`;
- index `idx_listings_section(section, status, created_at)`.

## 2. Shared rules
- `shared/scam-check.js`: `checkAd()` returns `{ block, hold }`.
- `shared/contact-details.js`: the phone/link/email check, moved from `server/src/lib/contact-guard.js` (which now re-exports it).

## 3. Server
- `server/src/lib/categories.js`: `SECTIONS`, `HOUSING_CATEGORIES`, `JOB_CATEGORIES`, `JOB_TYPES`, `categoriesFor()`.
- `server/src/app.js`: `/api/meta` also returns `sections` and `jobTypes`.
- `server/src/routes/listings.js`:
  - `section` on create, with `rent`, `bedrooms`, `furnished` and `jobType`;
  - `adChecks()`: scam check, repeat and daily limit, hold;
  - `?section=` and the new filters on `GET /api/listings`;
  - new `GET /api/listings/sections`;
  - held ads hidden; responders only for requests.
- Held ads are also hidden in `routes/conversations.js` (contact → 404), `routes/feed.js`, `routes/demand.js` and the link preview in `app.js`.
- `server/src/routes/admin.js`: `GET /api/admin/held-ads`, `POST /api/admin/held-ads/:id/decision` (`approve`/`remove`); `heldAds` in stats.
- `server/src/lib/notify.js`: kinds `ad-reply`, `ad-approved`, `ad-removed`.
- `server/src/lib/push.js`: wording for `ad-reply`.
- `server/src/lib/i18n.js`: Arabic for the new errors and field names.
- `server/src/demo-ads.js` + `server/src/seed.js`: 6 housing and 6 job demo ads.

## 4. App (`client/src/`)
- `sections.js` (names, paths, `adPrice()`).
- `pages/Board.jsx` (front page), `pages/AdList.jsx` (Housing/Jobs lists, `AdRow`).
- `pages/NewListing.jsx` (section buttons, fields, live scam warning).
- `pages/ListingDetail.jsx` (`AdReplyPanel`, `AdOwnerPanel`).
- `pages/admin/AdminHome.jsx` (`HeldAds`).
- `pages/Notifications.jsx`.
- `App.jsx` (routes `/`, `/me`, `/housing`, `/jobs`).
- `components/SideNav.jsx`, `TabBar.jsx`, `Layout.jsx`, `Icon.jsx` (Buildings, Briefcase).
- `hooks.js`.
- `styles.css` (end of file: "Craigslist-style sections").
- `locales/ar.js` (about 110 new Arabic texts).

## Check it (Windows cmd, top folder)
```
npm test
npm run seed
npm start
```
Open the address shown. The front page shows the Housing, Jobs and Wanted columns. Log in as `fatima@demo.local` / `Password123`, click **Post an ad**, type "deposit before viewing by Western Union" in Details: a red warning appears and Post is disabled.
