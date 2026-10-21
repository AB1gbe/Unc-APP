---
tags: [feature, shops]
---
# Shop pages (business accounts)

**Why this design:** [[ADR-030 Shop pages]]. **Build steps:** [[Step 30 - Shop pages]].
**Where:**
- Server: `server/src/routes/auth.js` (`/cover`, the `shopArea`/`shopHours` part of `PATCH /me`), `server/src/lib/shop-hours.js`, `server/src/lib/contact-guard.js`, `shopFields()` in `server/src/middleware/auth.js`.
- Client: `client/src/components/ShopEditor.jsx`, `client/src/components/ShopHours.jsx`, `client/src/hours.js`, `client/src/pages/MemberProfile.jsx`.

| Shop page (desktop) | Shop page in Arabic on a phone |
|---|---|
| ![[s24-shop-page.png]] | ![[s24-ar-phone-shop.png]] |

## What a shop page shows
The public profile of every **business** account turns into a shop page:
- a **cover photo** across the top;
- the **area**, with a **Map ↗** link that searches the area in Google Maps;
- **"Open now · until 21:00"** or **"Closed now · opens Saturday 09:00"**, worked out on the visitor's device;
- an **Opening hours** table with today in bold. Day names come from the browser, so they appear in Arabic automatically;
- everything a profile already had: verified badge, earned badges, specialities (interests), deals, rating, "Found on Unc" stories, reviews, and what they're looking for.

## Setting it up
**Account → Your shop page** (business accounts only):
- **Cover photo:** shrunk in the browser to 2000 px.
- **Area:** for example "Seef, Manama"; up to 80 characters.
- **Opening hours:** tick the days you're open and set the times. If the closing time is earlier than the opening time, it means you close after midnight (for example 18:00–02:00). Then press **Save shop page**.

## No contact details, on purpose
Buyers may only contact a shop through one of their requests (the MUST in [[01 Project Brief]]). So:
- there are **no phone, website, WhatsApp or email fields**;
- the server refuses a **bio** or **area** that contains a phone number (7 or more digits, Western or Arabic), a link (`www.`, `.com`, `.bh`, `wa.me`…), an email or an `@handle`. The error says: "Please don't add phone numbers, links, emails or @handles here. Buyers contact you through their requests."
- Messages inside a request's conversation are not checked: they are already in the right place.

## Tests
- `server/test/shop.test.js` (4): setting up a shop, individuals refused, hour validation, the contact-details guard, and "open now" including late shifts.
- `e2e/smoke.mjs`: the seller's phone number is refused; they set the area, hours and cover; the buyer sees the shop page.
- `e2e/devices.mjs` now also opens the demo shop's page (10 pages).
