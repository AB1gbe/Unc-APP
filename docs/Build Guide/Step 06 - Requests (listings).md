---
tags: [build-guide]
step: 6
---
# Step 06 — Requests (listings)

**Files:** `server/src/lib/categories.js`, `server/src/routes/listings.js`.

- `CATEGORIES` (16) and `CURRENCIES` (USD, EUR, GBP, CAD, AUD) are served by `GET /api/meta` so the client never hard-codes them.
- `listingView(row, images)` converts DB rows (snake_case) to API objects (camelCase) and never exposes the buyer's email.
- **Browse** (`GET /api/listings`): only `status='open'` and buyer not banned; filters `q` (title/description `LIKE`), `category`, `city`; 20 per page; fetches 21 to know if there's a next page (`hasMore`).
- **Create** requires `requireVerified`; multipart so up to 3 reference photos can be attached (public folder).
- **Edit** (PATCH) only by owner and only while open.
- **Status** `open → fulfilled/closed → open`: closing makes all its conversations read-only (Step 07).
- A non-open request returns 404 to everyone except its owner/admin.
- For a logged-in vendor the detail response includes `myConversationId` so the UI shows "Open conversation" instead of a second offer form.

Next → [[Step 07 - Listing-bound messaging]]
