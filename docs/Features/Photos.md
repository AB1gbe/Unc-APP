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
| Shop cover photo (session 24) | 1 | everyone | `uploads/covers` (public) |
| "Found it" story (session 20) | 1 | everyone | `uploads/stories` (public) |
| Proof photo (session 34) | a chat photo marked "proof" | the chat's two members | `uploads/chat` (private) |
| ID documents (KYC) | 3 | admins only | `uploads/kyc` (**private**, never served directly) |

## Safety rules
- Every file's first bytes are checked (JPEG/PNG/WebP), all files before any is saved; a failure deletes the ones already written.
- Chat photo URL `/api/conversations/:id/images/:file` checks: logged in, in that conversation, and the file belongs to a message **in that conversation** (otherwise 404). `Cache-Control: private`.
- A missing public photo returns 404, not 500 ([[Mistakes and Fixes#M52]]).
- Photos are shrunk in the browser to max 1600 px, JPEG 85 % before upload.

Tests: `server/test/photos.test.js` (6 tests: privacy, cross-conversation, non-image, limits, admin).

## Example photos in the demo data (session 54)
**Why:** [[ADR-054 Example photos in the demo data]] · **Build:** [[Step 54 - Example photos in the demo data]]

| Browse (computer) | Compare offers (phone) |
|---|---|
| ![[s54-browse-photos.png]] | ![[s54-compare-photos-phone.png]] |

`npm run seed` now adds:
- a photo on each demo request (PS5, oak table, wardrobe, iPhone charger);
- a photo with each of the two PS5 offers (in the chat and in Compare offers);
- profile photos for Sam, Riverside Electronics and Alex;
- the shop's cover photo;
- the photo on the "found it" story.

They are simple drawings (emoji and shapes on a soft background) made by `scripts/make-demo-photos.mjs` and kept in `server/demo-photos/`. Seed stores them exactly like a member's upload (`saveFiles`: checked, random name), and only where a photo is missing, so running `npm run seed` again adds nothing twice.

How a member adds photos (nothing new; this is where to find it):
- **Request:** "Post a request" → "Reference photos (optional, up to 6)". Later: Edit → add or remove.
- **Offer:** on someone's request → "Photo of your item (optional)".
- **Chat:** the 📷 button next to the message box (sellers can tick "proof photo").
- **Profile / shop:** Account → Your profile (photo) and Shop page (cover).
- **Story:** after a deal, "Share how it went" → photo.

Test: `server/test/demo-photos.test.js`.

## Short videos (session 58)
Chats and offers can also carry a short video (≤ 1 minute, 25 MB), private like chat photos → [[Orders, Wallet, Invites and Video#3. Short videos with offers and in chats]].
