---
tags: [decision, photos]
status: accepted
date: 2026-11-04
---
# ADR-054 Example photos in the demo data

The owner asked for members to be able to post images "and an example of it in the app" ([[2026-11-04 Session 54]]). Posting photos already worked everywhere ([[Photos]]), but the demo data had none, so the app looked photo-less.

| Question | Options | Chosen | Why |
|---|---|---|---|
| Where the pictures come from | Real stock photos; AI-generated photos (paid service); **drawings made by our own script** | Our own drawings | Free, no copyright or licence questions, look the same on every PC, and easy to remake. |
| How they're made | Hand-made files; **`scripts/make-demo-photos.mjs` (browser renders emoji + shapes)** | Script | Replicable; the same way as the app icons (`scripts/make-icons.mjs`). |
| Where they're kept | Made at seed time; **committed JPEGs in `server/demo-photos/`** | Committed | The owner's PC doesn't need the test browser to seed; 11 files, ~250 KB in total. |
| How seed stores them | Copy files directly; **through `saveFiles()`** | `saveFiles` | Same checks and random names as real uploads. |
| Running seed again | Add more; **only fill gaps** | Fill gaps | No duplicates. |

**Revisit when:** there are real members and listings (then demo data is only for testing), or the owner wants realistic product photos (licensed stock photos).
