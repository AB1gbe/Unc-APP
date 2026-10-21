---
tags: [decision, sharing]
status: accepted
date: 2026-10-21
---
# ADR-027 Sharing and link previews

See [[Social Touches#4. Share to WhatsApp, with preview cards]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Preview tags | Server-side rendering of React (much bigger change); a prerender service (paid); **the server adds Open Graph tags to index.html for each page** | Tags only | WhatsApp, X and iMessage only read `<meta>` tags; about 60 lines of code. |
| Preview image | Generate an image with the price (needs `sharp` or a browser); **the first photo, or the app icon** | First photo | No native dependency. Revisit for nicer cards. |
| Language of the preview | Viewer's (unknown to the crawler); **the buyer's** | Buyer's | They are the one sharing most often. |
| What gets a rich preview | Any request; **open requests of members who aren't banned** | Open only | Closed or hidden requests reveal nothing. |
| Share UI | Custom menu everywhere; **the phone's share sheet when available, otherwise WhatsApp + Copy link** | Native first | Shows every app the person uses; WhatsApp is the main one in Bahrain ([[Bahrain Market Research]]). |

## Revisit when
- Instagram Stories or Snapchat sharing matters → generate a share image.
