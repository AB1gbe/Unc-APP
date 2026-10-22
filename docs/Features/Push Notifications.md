---
tags: [feature, notifications, push]
---
# Push notifications to your phone (new offers)

**Why this design:** [[ADR-022 Push notifications]]. **Build steps:** [[Step 22 - Push notifications]].
**Where:**
- Server: `server/src/lib/push.js` (`pushTo`, keys, the wording), `server/src/routes/push.js` (`/api/push/*`), and the `pushTo(...)` call in `server/src/routes/conversations.js` (new offer).
- Client: `client/public/sw.js` (service worker), `client/src/push.js` (on/off for this device), `client/src/components/PushSettings.jsx` (the card), `client/src/auth.jsx` (turns it off on log out).

## What the member sees
1. Account page (and the 🔔 page while notifications are off): a **Notifications on this phone** card → **🔔 Turn on notifications**.
2. The phone asks "Allow notifications?" → Allow.
3. The card shows **✓ On for this device**, with **Send a test** and **Turn off** buttons.
4. When a seller makes an offer on one of your requests, the phone shows **New offer: "Riverside Electronics made an offer on 'Used PS5…'"**, even when Unc is closed. Tapping it opens that conversation.

Notifications are sent in the member's language (Arabic gets right-to-left). Each phone, tablet or computer is turned on separately. Logging out turns that device off, so the next person on a shared tablet doesn't get your offers.

## Which devices
| Device | Works? | What to do |
|---|---|---|
| Android phone (Chrome, Edge, Firefox, Samsung Internet) | ✅ | Open Unc → Account → Turn on |
| iPhone / iPad (iOS 16.4 or newer) | ✅ only from the Home Screen app | Safari → Share → **Add to Home Screen** → open Unc from the home screen → Account → Turn on. The card explains this when needed. |
| Windows / Mac (Chrome, Edge, Firefox, Safari) | ✅ | Same button; the notification appears in the corner of the screen |
| Private / incognito window | ❌ | Browsers don't allow it there ([[Mistakes and Fixes#M58]]) |
| Any `http://` address except `localhost` | ❌ | Browsers require `https://` (see below) |

## Try it (optional, and why https matters)
Browsers only allow notifications on secure (`https://`) addresses, plus `localhost` for developers. So:

**A. On your PC (works now, no setup).** In Command Prompt, inside `Unc-APP`, on branch `claude/vibrant-edison-r9o798`:
```
npm run dev
```
1. Open http://localhost:5173 in Chrome or Edge and log in as the buyer `buyer@demo.local` / `Password123`.
2. Go to **Account → 🔔 Turn on notifications → Allow → Send a test**.
3. In a **second** browser (or a private window) log in as the seller `vendor@demo.local` / `Password123` and make an offer on one of the buyer's requests. The notification pops up on your PC.

**B. On your phone (needs an https address).** Choose one:
- Put Unc online ([[Deploying to Production]]). Hosts give you an https address automatically.
- Or, just for testing, a temporary tunnel. It gives your PC's app a random public https address for as long as the window stays open. This option is **not yet tested in this project**; it is a standard Cloudflare tool. Use two command windows inside `Unc-APP`:
  ```
  npm run build --workspace client
  npm start
  ```
  ```
  npx cloudflared tunnel --url http://localhost:4000
  ```
  Open the `https://….trycloudflare.com` address it prints on your phone. Anyone with that address can reach your app while it runs, so close the window (Ctrl + C) when you're done.

## Rules
| Rule | Why | Where |
|---|---|---|
| Pushes for **new offers** (buyers) and, since session 28, for a request from a member who **favourited you** (sellers) | The two moments worth interrupting someone for | `conversations.js` contact route; `tellFavourites()` in `routes/favourites.js` |
| Sent **after** the offer is saved | Never announce an offer that failed | outside `tx()` |
| A push problem never fails the offer | The offer matters more than the alert | `pushTo()` catches everything |
| Dead devices (push service says 404/410) are deleted | Phones reset, apps get uninstalled | `pushTo()` |
| Max 10 devices per member | Limits junk rows | `routes/push.js` |
| Banned members get nothing | | `pushTo()` |
| The lock screen shows the seller's name and the request title, never the message or price | Useful but not too revealing | `TEXT` in `lib/push.js` |
| Keys: `VAPID_*` env vars, or made once into `server/data/vapid.json` | Works without setup | `vapidKeys()` |

Tests: `server/test/push.test.js` (4 tests, using a fake push service). A real phone delivery could not be tested in the build sandbox, because its network can't reach Google's or Apple's push servers. Do the test in "Try it" above once.
