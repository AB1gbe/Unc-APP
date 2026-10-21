---
tags: [build-guide, messaging]
step: 7
---
# Step 07 — Listing-bound messaging

**File:** `server/src/routes/conversations.js`. Rules table: [[Listing-Bound Messaging]]. Why: [[ADR-006 Messaging model]].

## The one way in
```
POST /api/listings/:id/contact   { message, offerPrice? }
  requireVerified
  → 404 if no listing
  → 409 if listing not open
  → 403 if you own it
  → 409 + conversationId if you already contacted
  → transaction: insert conversation(listing, buyer, vendor) + first message + audit
```

## Everything else needs an existing conversation you're part of
`participantConv(req)` loads the conversation and returns **404** unless you're its buyer or vendor.
- `GET /conversations/:id?after=N` → messages with id > N; marks the other side's messages read.
- `POST /conversations/:id/messages` → `requireVerified`, 409 if listing not open, `offerPrice` only accepted from the vendor.

## Inbox query
One SQL query returns each conversation with the listing title/status, the other party, the last message (sub-select) and the unread count (sub-select), newest first.

## Reports
`POST /api/reports` with `listingId` or `conversationId` — for conversations, only participants may report.

## Check it
`server/test/messaging.test.js` (11 tests). The first test proves there is **no** direct-message endpoint.

Next → [[Step 08 - Admin and moderation]]
