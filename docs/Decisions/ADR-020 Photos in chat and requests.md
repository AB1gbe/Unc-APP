---
tags: [decision, photos, privacy]
status: accepted
date: 2026-10-21
---
# ADR-020 Photos: chat photos private, request photos public, shrunk in the browser

See [[Photos]]. Builds on [[ADR-008 File storage]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Chat photo visibility | Public URL like request photos; **private: only the two people in that conversation** (`uploads/chat`, served by `GET /api/conversations/:id/images/:file`) | Private | A chat is private (MUST #3). The route checks the member is in the conversation *and* the file belongs to a message there. Admins see them only through a report, and each view is logged. |
| Photos per message | Several; **one** | One | Simple UI; send another message for another photo. |
| Request photos | 3; **6** | 6 | Enough angles of a reference item without turning requests into listings. |
| Shrinking | Server resizes (needs `sharp`, native build on Windows); **browser shrinks before upload** (canvas, max 1600 px, JPEG 85 %) | Browser | Much faster on phone data; no native dependency. The server still checks file type by magic bytes and size. |
| Viewer | Open the image in a new tab; **full-screen viewer** (swipe, arrow keys, Esc; RTL-aware) | Viewer | Feels like an app; works on phones. |

## Revisit when
- Storage grows → move uploads to object storage (S3/R2) with signed URLs for chat photos.
