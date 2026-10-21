---
tags: [decision, social, privacy]
status: accepted
date: 2026-10-21
---
# ADR-031 "Happening near you" feed

Context: "build the happening near you feed next", from [[Social Marketplace Ideas]]. See [[Social Touches#6. "Happening near you" (session 26)]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| What counts as activity | Every message and view; **finds (deals), new open requests, new verified shops, a daily offers count** | These four | Shows life on Unc without exposing chats or browsing. |
| Names | Show who found what; **private people never named; shops named** | Anonymous people | Finds are about closed requests, which aren't public anymore. Shops chose a public page ([[ADR-030 Shop pages]]). |
| Find details | The request title; **city + category only** | City + category | The title can identify the person and what they bought. |
| "Near you" | Distance with map coordinates (not stored); **same city text, own city first** | City text | Uses what members already enter; no location tracking. |
| Freshness | Live updates; **loaded with the page, last 7 days, 8 items** | On load | Simple; Home is opened often. |
| Fake activity to fill a quiet feed | Yes; **never** | Never | It's on the "never" list in [[Social Marketplace Ideas]]. An empty feed simply doesn't show. |
| Speed | Count everything on each request; **indexes on the time columns (migration 17)** | Indexes | The feed is on every Home visit (checked in `performance.test.js`). |

## Revisit when
- Many members per city → show a feed per area (Seef, Juffair…) or add "see more".
- Members want it quieter → a setting to hide the card.
