---
tags: [build-guide, photos]
step: 20
---
# Step 20 — Photos everywhere (session 13)

**What/why:** [[Photos]], [[ADR-020 Photos in chat and requests]].

## 1. Database: migration 7
```sql
ALTER TABLE messages ADD COLUMN image TEXT;
```

## 2. Server
- `lib/uploads.js`: `CHAT_DIR()` returns `uploads/chat`. **Never** serve it with `express.static`.
- `routes/conversations.js`:
  - `const chatUpload = memoryUpload(1)`; `chatUpload.single('image')` on `POST /listings/:id/contact` and `POST /conversations/:id/messages`.
  - The text is optional when there is a photo: `v.str(..., { optional: Boolean(req.file) })`.
  - `insertMessage(..., image)`. If the insert fails, call `photo.discard()`.
  - `messageView` returns `imageUrl: /api/conversations/<id>/images/<file>`.
  - `GET /conversations/:id/images/:file`:
    - check `participantConv(req)`;
    - check the file with `SELECT 1 FROM messages WHERE conversation_id = ? AND image = ?`;
    - use `path.basename`;
    - set `Cache-Control: private`.
- `routes/listings.js`:
  - `MAX_PHOTOS = 6`; `listingView` returns `photos: [{ id, url }]`.
  - `POST /:id/images` (only the owner, only open requests, at most 6 in total).
  - `DELETE /:id/images/:imageId`.
- `routes/admin.js`: `GET /reports/:id/images/:file` (audited, `no-store`). The reported conversation's messages include `imageUrl`.
- `lib/http.js` `errorHandler`: `if ((err?.status ?? err?.statusCode) === 404) return res.status(404).json({ error: 'Not found' })` ([[Mistakes and Fixes#M52]]).

## 3. Client
- `components/PhotoPicker.jsx`: previews, ✕ to remove, shrinks each file, shows "{left} of {max} photos left". Used in `NewListing.jsx` (`max 6`) and in the offer form (`id="offerPhoto"`, `max 1`).
- `NewListing.jsx` in edit mode:
  - existing photos with ✕ (`DELETE`);
  - new photos are uploaded with `POST /:id/images` after the `PATCH`.
- `components/Lightbox.jsx`: a portal; swipe, ←/→ (swapped in Arabic), Esc.
- `Conversation.jsx`:
  - 📷 label with a hidden file input;
  - `PhotoPreview`;
  - sends `FormData`;
  - `.bubble-photo` opens the Lightbox.
- `Inbox.jsx`: shows "📷 Photo" when the last message has no text.
- `ui.jsx` `ListingCard`: the first photo in `.card-photo`.
- `styles.css`:
  - `.card-photo`, `.gallery`, `.lightbox`, `.attach`, `.bubble-photo`;
  - `.chat-form .btn { flex-shrink: 0; white-space: nowrap }` ([[Mistakes and Fixes#M54]]).

## 4. Check
`server/test/photos.test.js` (6 tests). `e2e/smoke.mjs` covers an offer photo, a chat photo and opening/closing the viewer.
```
npm test
npm run e2e
```
