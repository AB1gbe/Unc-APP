---
tags: [build-guide, photos]
step: 58
---
# Step 58: Short videos in chats (session 58)

**What/why:** [[Orders, Wallet, Invites and Video#3. Short videos with offers and in chats]], [[ADR-058 Short videos in chats]].

1. Migration 37: `ALTER TABLE messages ADD COLUMN video TEXT;`
2. `server/src/lib/uploads.js`: `memoryUpload(maxFiles, maxBytes)`, `VIDEO_MAX_BYTES` (25 MB), `sniffVideo()` (`ftyp` → MP4/MOV, `1A 45 DF A3` → WebM), `saveVideo()`. `server/src/lib/http.js`: its own "too large (max 25 MB)" message for videos.
3. `server/src/routes/conversations.js`:
   - the chat upload takes the fields `image` (5 MB, checked by hand) and `video`;
   - `saveChatFiles()` saves both, or neither;
   - messages store `video` and return `videoUrl`;
   - `GET /conversations/:id/videos/:file` serves it to members only;
   - the inbox returns `lastVideo` and compare returns `hasVideo`.
4. `server/src/routes/admin.js`: report conversations include `videoUrl`; `GET /admin/reports/:id/videos/:file` (logged). `server/src/lib/deletion.js`: deleting an account removes the videos the member sent.
5. Client:
   - `client/src/videos.js` and `components/VideoPicker.jsx` (type, size and 1-minute checks, preview);
   - the 🎬 button and `<video>` player in `Conversation.jsx`;
   - the "Short video of your item" field in `ListingDetail.jsx`;
   - "🎬 Video" in `Inbox.jsx` and `CompareOffers.jsx`.
6. Tests: `server/test/chat-video.test.js`; `e2e/smoke.mjs` sends a video and checks the buyer sees the player.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
