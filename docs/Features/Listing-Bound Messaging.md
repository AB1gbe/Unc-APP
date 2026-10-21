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
| Suspended members | No new offers on a banned buyer's request (404); no messages to a suspended member (409) |
| Closed request still viewable by its vendors | So the chat's "About" link keeps working |
| Polling | Every 4 s, paused while the tab is hidden ([[ADR-013 Performance]]) |

## The flow on screen
| | |
|---|---|
| Vendor opens a request and makes an offer | ![[10-make-offer.png]] |
| Buyer's inbox — grouped under the request | ![[11-buyer-inbox.png]] |
| Conversation — header always says "About: <request>" | ![[13-buyer-chat.png]] |
| Buyer's request page lists offers + close buttons | ![[08-request-owner-view.png]] |

## Offers
The first message can carry an `offerPrice`. Since session 20, **both sides** can put a price on a later message (the buyer's is a counter-offer), and the text can be empty when there's a price.
Prices show as cards. The other side's **newest** price can be answered once with **Accept** or **Not for me**, or countered. Answers are messages with `kind` = `accept` or `decline` and `reply_to` pointing at the price.
Accepting doesn't close the request; the buyer still confirms with "I found it!". Details: [[Social Touches#2. Offer cards: Accept / Counter / Not for me, and quick replies]].

## Read receipts & unread
Opening a conversation sets `read_at` on the other side's messages. Your own messages show "· Seen" once read. Header badge = total unread (see [[Mistakes and Fixes#M11]]).
