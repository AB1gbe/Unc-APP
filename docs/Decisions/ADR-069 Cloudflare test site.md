---
tags: [decision, hosting, cloudflare]
status: accepted
date: 2026-11-12
---
# ADR-069 Cloudflare test site

The owner: "I have a domain b1gbe.org in Cloudflare, can we create a worker for this instead of opening cmd, and you can automatically update when I tell you to." Then: **"1, all Cloudflare, but this is only for test."**

| Question | Options | Chosen | Why |
|---|---|---|---|
| Where Unc runs | Owner's PC (cmd, tunnel); small server + Cloudflare in front; **all on Cloudflare** | All Cloudflare | The owner's choice; the owner already uses Cloudflare for b1gbe.org. |
| Database on Cloudflare | D1 (async: rewrite every query); Containers (disk is wiped on restart); **one Durable Object with its own SQLite** | Durable Object | Its SQLite is synchronous like Node's, so the app's queries stay the same. A stand-in for `node:sqlite` maps them. |
| Uploaded photos/videos | R2 (async, rewrite); **rows in the Durable Object's SQLite (`_files`)** | Same database | Keeps the app's file code. Fine for a test; 25 MB videos are the largest. |
| The app's code | Rewrite for Workers; **same Express app** (`cloudflare:node` http handler) + small "if on Cloudflare" spots | Same app | One codebase: the PC version and all 192 tests stay as they were. |
| Website files | **Workers static assets** (`client/dist`) | Assets | Fast, free, no code. |
| Updates | Owner runs commands; **GitHub workflow on every change to `main`** | Workflow | "Update" = merge the pull request; the site publishes itself. Skips until the key is added. |
| Email | Real provider; **console mode (codes shown on screen)** | Console | Test only, as the owner said. Anyone can sign up without a real inbox. |
| Address | **unc.b1gbe.org** | | Like the owner's jpn.b1gbe.org. Change `routes` in `cloudflare/wrangler.jsonc`. |

**Not for real users yet:** emails aren't sent, everything is one Durable Object (fine for a test), and ID photos are stored on Cloudflare outside Bahrain (PDPL, ask the lawyer). Search engines are told not to list it (`X-Robots-Tag: noindex`).

**Revisit when:** going live (real email, PDPL, maybe R2 for files and D1/separate objects for scale).
