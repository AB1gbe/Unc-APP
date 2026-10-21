---
tags: [feature, photos]
---
# Photos (requests, offers, chat, profiles)

**Why:** [[ADR-020 Photos in chat and requests]], [[ADR-008 File storage]]. **Build steps:** [[Step 20 - Photos everywhere]].
**Where:** `server/src/lib/uploads.js` (folders, `saveFiles`, `avatarUrl`), `server/src/routes/listings.js` (`MAX_PHOTOS = 6`, add/remove), `server/src/routes/conversations.js` (chat photos), `server/src/routes/admin.js` (report photos), `client/src/images.js` (`shrinkImage`), `client/src/components/PhotoPicker.jsx`, `Lightbox.jsx`, `pages/NewListing.jsx`, `ListingDetail.jsx`, `Conversation.jsx`.

| Offer with a photo | Photo in the chat | Full-screen viewer |
|---|---|---|
| ![[s13-offer-photo.png]] | ![[s13-chat-photo.png]] | ![[s13-photo-viewer.png]] |

## Where photos can go
| Place | How many | Who can see it | Stored in |
|---|---|---|---|
| Request (buyer's reference photos) | up to **6**; add/remove while editing an open request | everyone | `uploads/listings` (public) |
| Profile photo | 1 | everyone | `uploads/avatars` (public) |
| Offer / chat message | 1 per message (text optional with a photo) | **only the buyer and that seller**; admins only via a report (logged) | `uploads/chat` (**private**) |
| ID documents (KYC) | 3 | admins only | `uploads/kyc` (**private**, never served directly) |

## Safety rules
- Every file's first bytes are checked (JPEG/PNG/WebP), all files before any is saved; a failure deletes the ones already written.
- Chat photo URL `/api/conversations/:id/images/:file` checks: logged in, in that conversation, and the file belongs to a message **in that conversation** (otherwise 404). `Cache-Control: private`.
- A missing public photo returns 404, not 500 ([[Mistakes and Fixes#M52]]).
- Photos are shrunk in the browser to max 1600 px, JPEG 85 % before upload.

Tests: `server/test/photos.test.js` (6 tests: privacy, cross-conversation, non-image, limits, admin).
