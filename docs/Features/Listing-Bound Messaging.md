---
tags: [feature, messaging]
---
# Listing-Bound Messaging

**Why:** MUST #3 — "you cannot just chat; it has to be about a specific listing". Options compared: [[ADR-006 Messaging model]]. Real-time choice: [[ADR-007 Real-time updates]].
**Where:** `server/src/routes/conversations.js`, `client/src/pages/ListingDetail.jsx` (OfferPanel/OwnerPanel), `Inbox.jsx`, `Conversation.jsx`.

## The rules
| Rule | Enforced by |
|---|---|
| A conversation always has a listing | DB `listing_id NOT NULL`; only one creation endpoint: `POST /api/listings/:id/contact` |
| No direct "message user" | No such endpoint exists (tested); no such button in UI |
| Only verified non-owners start one (vendor → buyer) | `requireVerified` + owner check |
| One thread per vendor per request | DB `UNIQUE(listing_id, vendor_id)` + 409 with existing id |
| Vendors can't see each other | Each thread is buyer ↔ one vendor |
| Closed/fulfilled request = read-only | Check on send; UI hides the input |
| Outsiders can't read | Participant check, returns 404 |
| Safety | Report button on request + conversation pages; admin reads only reported threads |

## The flow on screen
| | |
|---|---|
| Vendor opens a request and makes an offer | ![[10-make-offer.png]] |
| Buyer's inbox — grouped under the request | ![[11-buyer-inbox.png]] |
| Conversation — header always says "About: <request>" | ![[13-buyer-chat.png]] |
| Buyer's request page lists offers + close buttons | ![[08-request-owner-view.png]] |

## Offers
The first message can carry an `offerPrice`; vendors can send new prices in later messages. Shown as "💰 Offer: $380" in the bubble. Buyers can't attach prices (they're not offering).

## Read receipts & unread
Opening a conversation sets `read_at` on the other side's messages. Your own messages show "· Seen" once read. Header badge = total unread (see [[Mistakes and Fixes#M11]]).
