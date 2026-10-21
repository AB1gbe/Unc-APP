---
tags: [feature, notifications]
---
# Saved requests (♡) and notifications (🔔)

**Why:** [[ADR-021 Saved requests and notifications]]. **Build steps:** [[Step 21 - Saved requests and notifications]].
**Where:** `server/src/routes/listings.js` (`/saved`, `/:id/save`), `server/src/lib/notify.js`, `server/src/routes/notifications.js`, the `notify(...)` calls in `conversations.js` (offer), `listings.js` (deal), `ratings.js` (rating), `kyc/index.js` (identity result); `client/src/pages/Saved.jsx`, `Notifications.jsx`, `ListingDetail.jsx` (`SaveButton`), `Home.jsx` (Saved for later), `components/Layout.jsx` (bell + polling).

| Saved requests | Notifications |
|---|---|
| ![[s13-saved.png]] | ![[s13-notifications.png]] |

## Saved requests
- **♡ Save** on any open request that isn't yours → it turns into **♥ Saved**. Tap again to remove.
- Find them at **Home → Saved for later**, **Account → ♥ Saved requests**, or `/saved`.
- Closed requests drop off the list (they come back if the buyer reopens).

## Notifications
| Event | Who gets it | Opens |
|---|---|---|
| A seller made an offer on your request | buyer | that conversation |
| The buyer picked your offer (deal done) | seller | that conversation |
| The other side rated your deal | the rated member | that conversation |
| Identity approved / not approved | the member | Home / Verification page |

- New offers also reach your **phone** if you turned that on: [[Push Notifications]] (session 15).
- New **messages** are not notifications — the Messages tab has its own count.
- The 🔔 count is checked every 15 s and on every page change; opening the page marks everything read.
- Undoing a deal removes its notification. Read notifications older than 90 days are deleted automatically.

Tests: `server/test/saved.test.js` (2), `server/test/notifications.test.js` (3); index checks in `performance.test.js`.
