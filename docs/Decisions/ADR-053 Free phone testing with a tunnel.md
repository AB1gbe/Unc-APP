---
tags: [decision, mobile]
status: accepted
date: 2026-10-25
---
# ADR-053 Free phone testing with a tunnel

The owner wants to test Unc as an app on a phone without paying anything ([[2026-10-25 Session 44]]).

| Option | Cost | Good | Bad |
|---|---|---|---|
| Same Wi-Fi, `http://<PC address>:5173` | Free | Nothing to install | Not https: phones won't install it as an app; no service worker or push; Windows firewall prompts |
| **Cloudflare quick tunnel (`cloudflared tunnel --url`) to `npm start`** | **Free, no account** | Real https address, so it installs like an app; works with PWABuilder for a test `.apk`; production-like (built site served by the server) | PC must stay on; new address each time; public while running |
| Free hosting tier (e.g. Render free) | Free, needs an account | Runs without the PC | Sleeps when idle, no lasting disk (data lost), more setup |
| ngrok free | Free, needs an account | Similar to Cloudflare | Account + warning page in front of the app |

**Decision:** Cloudflare quick tunnel, serving the built app with `npm run build` + `npm start` (no code changes needed). Steps: [[Step 53 - Test as an app on your phone for free]].

**Revisit when:** the owner is ready to pay for hosting and a domain ([[Publishing as an App]]); then the address is permanent and the Play Store package can be verified with `assetlinks.json`.
