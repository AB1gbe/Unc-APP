---
tags: [decision, messaging]
status: accepted
date: 2026-10-21
---
# ADR-006 Messaging: every conversation belongs to exactly one listing

## Requirement (MUST #3)
"When a consumer posts, the vendor then contacts him privately about said listing, nothing else. You cannot just chat — it has to be about a specific listing."

## Options considered
| Option | Why not / why |
|---|---|
| Normal DMs with an optional "about listing" tag | Tag is optional → free chat possible. ❌ Violates the MUST. |
| Public comments under each listing | Not private. ❌ |
| One group chat per listing (buyer + all vendors) | Vendors would see each other's offers/prices. ❌ |
| **Conversation = (listing, buyer, vendor), created only from a listing** ✅ | Free chat is *structurally impossible* |

## Decision — enforced at three layers
1. **Database**: `conversations.listing_id NOT NULL`, `UNIQUE (listing_id, vendor_id)`, `CHECK (buyer_id <> vendor_id)`.
2. **API**: the *only* endpoint that creates a conversation is `POST /api/listings/:id/contact`. There is no "message a user" endpoint. A test asserts that `/api/messages`, `/api/conversations` (POST) and `/api/users/:id/messages` don't exist.
3. **UI**: there is no "message this person" button anywhere. The only entry point is **"Have this? Make an offer"** on a request page. Every chat header shows *"About: <request title>"*, and the inbox groups chats under their request.

Further rules:
- Only a **verified** user who is **not the owner** can start one (vendor-initiated). Buyers reply; they can't cold-message vendors.
- One conversation per vendor per request; contacting twice returns the existing one.
- When the buyer marks the request **fulfilled** or **closed**, all its conversations become **read-only** and no new offers are accepted.
- Outsiders get **404** (not 403) on someone else's conversation so they can't even confirm it exists.
- Either participant can **report** a conversation; admins can read a conversation **only through a report** (logged in `audit_log`).
