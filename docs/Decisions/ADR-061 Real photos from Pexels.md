---
tags: [decision, design, photos]
status: accepted
date: 2026-11-11
---
# ADR-061 Real photos from Pexels

See [[Design System#Real photos (session 64)]] and [[Photo Credits]].

| Option | Result | Chosen |
|---|---|---|
| Drawn pictures (session 62) | Free, but not real photos | Replaced |
| AI photos (Higgsfield) | 0.25 credits each; the account has 0 credits | No |
| Unsplash | Needs an API key with `Client-ID` in front, which the key form can't save | No (for now) |
| free-images.com | Its `robots.txt` blocks automated tools | No |
| **Pexels API** | Free key; free licence; owner set it up | **Yes** |

**How:** fixed Pexels photo IDs in `scripts/fetch-photos.mjs`, so a re-run downloads the same pictures. Photos are cropped and committed; the app never calls Pexels.

**Revisit when:** Unc has its own photos (shops, finished deals), or a photo should show Bahrain specifically.
