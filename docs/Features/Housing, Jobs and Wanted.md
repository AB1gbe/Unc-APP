---
tags: [feature]
session: 82
---
# Housing, Jobs and Wanted (Craigslist-style)

Since session 82 Unc works like Craigslist with safety checks. Decision: [[ADR-071 Craigslist-style sections]]. Build steps: [[Step 71 - Craigslist-style sections]].

## What members see
- **Front page** (`/`, `client/src/pages/Board.jsx`) for everyone:
  - one search box with a section picker;
  - three columns (Housing, Jobs, Wanted) of category links with how many ads each has;
  - the newest 8 ads of each section as plain lines;
  - three safety promises; then verified shops.
- **Housing** (`/housing`) and **Jobs** (`/jobs`) (`AdList.jsx`):
  - one line per ad: when, title, price per month, bedrooms/furnished or job type, area;
  - filters: words, category, area, price, bedrooms, furnished, job type;
  - a safety line ("Never pay a deposit before…" / "Real employers never ask you to pay…").
- **Wanted** (`/browse`) is the old Requests page, unchanged.
- **My Unc** (`/me`) is the member's old home page (messages needing attention, their requests).
- **Posting** (`/requests/new?section=housing|jobs`):
  - Housing / Jobs / Wanted buttons at the top;
  - Housing asks for rent per month, bedrooms and furnished; Jobs asks for job type and pay per month;
  - the scam check runs while you type: a red box (and a disabled button) if the ad would be refused, a yellow box if it will be checked by a person.
- **An ad's page:** price per month and the facts; a "Send message" / "Apply for this job" box with a safety warning; the advertiser sees the replies, Edit, Rented/Job filled, Close and Reopen. Who replied is never shown to others.
- **Notifications:** "{name} replied to your ad", "Your ad was checked and is now showing", "Your ad was removed after a safety check".
- **Navigation:**
  - side bar: Home, Housing, Jobs, Wanted, Shops, My Unc, Messages, Notifications, My ads and requests, then "Post an ad";
  - phone tab bar for visitors: Home, Housing, Jobs, Wanted;
  - phone tab bar for members: Home, Housing, Post, Jobs, Messages, with My Unc in the header.

## Safety rules (shared/scam-check.js)
| Check | Result |
|---|---|
| Money before viewing/start: Western Union, MoneyGram, wire, gift/iTunes cards, crypto, "deposit before viewing", visa/registration/training fees (English + Arabic) | Refused (400) |
| Phone numbers, links, emails, @handles in the ad | Refused (400) |
| Same title, same section, within 7 days | Refused (409) |
| More than 5 Housing/Jobs ads in 24 hours | Refused (429) |
| Rent below BD 40 (room), 100 (flat), 250 (villa), 80 (office/shop) | Held |
| Pay above BD 3,000 a month | Held |
| "Work from home … no experience", "earn BD 500 a week", "I'm abroad", "keys by courier" | Held |

A held ad is hidden from lists, its page, link previews and replies until **Admin → Ads to check**: Approve (shows it; later edits aren't held again) or Remove (closes it). Requests (Wanted) are not checked this way.

## Test it
- `npm test`: `server/test/sections.test.js` (6 tests).
- `node e2e/smoke.mjs`: posts a Housing ad through the form (the scam text is refused on screen first), finds it under Housing, replies, and checks the notification.
- `e2e/arabic.mjs` and `e2e/devices.mjs` include `/`, `/housing`, `/jobs`, `/me` and the ad form.

## For sale and calmer rows (session 84)
See [[ADR-072 For sale section and calmer ad rows]] and [[Step 72 - For sale and calmer rows]].
- **For sale** (`/for-sale`): things people and shops sell, in the same 16 categories as Wanted. The ad needs an asking price and New or Used. Filters: words, category, area, price, condition. Safety line: "Meet in a public place and check the item before you pay." The owner's button says **Sold**.
- **Rows** everywhere (front page and lists): small photo (or the section's icon), title, price, one grey line such as "Juffair · 2 bedrooms · yesterday". One "Some ads here are samples" line above a list replaces the per-row badges.
- **Front page:** For sale, Housing, Jobs, Wanted, as 4 columns on wide screens and 2×2 on smaller ones. On phones, 2×2 boxes without category lists; the whole box opens the section. Then the newest 5 of each section, two side by side on wide screens.
- **Menus:** side bar adds For sale (first). Visitors' phone tabs: Home, For sale, Housing, Jobs, Wanted. Members' phone tabs: Home, For sale, Post, Housing, Messages. "Post an ad" opens the For sale form first.

## Marketplace look (session 85)
See [[ADR-073 Marketplace layout and light colours]]. The home page is now **Marketplace**: search, section chips (For sale, Housing, Jobs, Wanted with counts), **Today's picks** (newest For sale and Housing as a photo grid), newest jobs as rows, **What Bahrain is looking for** (Wanted as cards tagged "Looking for"), safety strip, shops. For sale and Housing lists are photo grids with category chips; Jobs stay rows. Ad pages open with one big photo, "Listed yesterday in Sitra", and For sale replies start as "Hi, is this still available?". Colours are light.
