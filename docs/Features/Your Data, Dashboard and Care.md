---
tags: [feature, vision]
---
# Your data, owner dashboard, away mode, pickup safety, follow-ups (session 37)

The "recommended next five" from [[New Directions for the Vision]], all built in [[2026-10-22 Session 37]]. Contact still happens only inside a request's conversation.

## 1. Download my data and delete my account
**Why:** [[ADR-043 Download and delete my data]] · **Build:** [[Step 43 - Download and delete my data]]
**Where:** `server/src/lib/deletion.js`, `GET /api/auth/me/export`, `POST /api/auth/me/delete` (and `/cancel`), Account → **Your data**, `client/src/components/DeletePending.jsx`

![[s37-delete-pending.png]]

- **⬇ Download my data** gives a JSON file with everything Unc holds about you: profile, settings, requests, your own messages, deals, ratings, stories, alerts, favourites, saved requests, blocks and reports. It never includes other people's messages, your password, or a full ID number (only the last 4 digits).
- **Delete my account** needs your password. Your open requests close at once and other devices are logged out. A red banner on every page says "Your account will be deleted on …", with **Keep my account**.
- After **7 days** the hourly job wipes it:
  - identity documents (files and records), profile photo, cover, request photos, chat photos you sent, stories;
  - alerts, favourites, saved, notifications, push and login records;
  - the account becomes "Deleted member", hidden like a banned one and impossible to log in to.
- Other people's chats, deals and ratings stay (showing "Deleted member"), so their history still makes sense. The audit log keeps only the member's number.
- If a **banned** member deletes their account, their ID number's fingerprint is kept, so they can't verify a new account with the same document. Anyone else can come back later.
- Admin accounts can't be deleted from the website.

## 2. Owner dashboard
**Why:** [[ADR-044 Owner dashboard]] · **Build:** [[Step 44 - Owner dashboard]]
**Where:** `server/src/lib/metrics.js`, `GET /api/admin/metrics?days=`, `client/src/pages/admin/Dashboard.jsx` (top of the Admin page)

![[s37-dashboard.png]]

- Pick **7, 30 or 90 days**. Tiles: requests posted, offers made, deals done, new members.
- **Requests with an offer**: the share of requests at least a day old that got an offer.
- **Time to first offer**: half of the first offers come faster than this (the middle value, so one slow request doesn't skew it).
- Bar charts: requests per day and offers per day. Hover or tab to a day to see its number; **Show as a table** lists the days.
- Top categories and requests by governorate.

## 3. Away mode
**Why:** [[ADR-045 Away mode]] · **Build:** [[Step 45 - Away mode]]
**Where:** Account → **Away mode**, `setAway()` and `NOT_AWAY` in `server/src/lib/activity.js`

![[s37-away.png]]

- Pick the last day you're away (up to 60 days). While away:
  - request alerts and favourite heads-ups pause;
  - your profile, chats and Compare offers show **🌴 Away until …** instead of "Active now";
  - messages that arrive while you're away don't count against your reply time, so a holiday doesn't cost you the ⚡ badge.
- **I'm back** ends it early.

## 4. Pickup checklist and big-deal safety card
**Why:** [[ADR-046 Pickup checklist and big-deal card]] · **Build:** [[Step 46 - Pickup checklist and big-deal card]]
**Where:** `client/src/pickup.js`, `client/src/components/PickupCard.jsx` (in the chat, once a price is accepted or there's a deal)

![[s37-pickup.png]]

- **✅ Pickup checklist** for that kind of item, e.g. phones: IMEI matches the box, Find My signed out, battery, screen and cameras. Every list ends with: matches the chat, meet in public, pay only when happy.
- The ticks are private notes kept **on this device** only.
- **🛡️ Big deal** card from 500 USD/EUR (400 GBP, 700 CAD, 750 AUD; 200 BHD, 2000 SAR/AED when those currencies come): meet at a bank or police safe spot, check papers, pay in a way that leaves a record, bring someone.

## 5. Report follow-up and raise my budget
**Why:** [[ADR-047 Report follow-up and raise my budget]] · **Build:** [[Step 47 - Report follow-up and raise my budget]]
**Where:** `POST /api/admin/reports/:id/resolve` (with `outcome`), `POST /api/listings/:id/budget`, `RaiseBudget` in `ListingDetail.jsx`

![[s37-raise-budget.png]]

- Admins now close a report with **✓ Took action** or **Nothing wrong**. The person who reported gets a 🔔: "Thanks for your report … our team looked at it and took action" (or found nothing against the rules). They are never told what happened to the other person.
- On an open request, **💸 Raise my budget** sets a higher top budget, **once a day**. Sellers who looked at or saved the request, haven't offered yet and may still answer it get a 🔔 "… raised the budget. Take another look?".
