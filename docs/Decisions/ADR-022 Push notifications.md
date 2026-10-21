---
tags: [decision, notifications, push]
status: accepted
date: 2026-10-21
---
# ADR-022 Push notifications (Web Push)

Context: "add push notifications to my phone for new offers". See [[Push Notifications]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Technology | Native app + Firebase/APNs SDKs; SMS (Twilio, costs per message); email; WhatsApp Business API; **Web Push** (standard, built into browsers) | Web Push | Works with the existing website/PWA ([[ADR-019 Phones, tablets and PWA]]); free; no app store. Cost: iPhone users must "Add to Home Screen" first (Apple's rule since iOS 16.4). |
| Library | Write the encryption by hand; **`web-push` npm package** | `web-push` | Small, widely used, does the VAPID signing and payload encryption. |
| Keys (VAPID) | Must be set in `.env`; **env if set, else generated once into `DATA_DIR/vapid.json`** | Auto | Works with zero setup locally; production can still pin them. |
| Which events | Every notification kind; **new offers only** (as asked) | Offers | Easy to extend: add a `TEXT` entry and a `pushTo()` call. |
| What the lock screen shows | Generic "You have a new offer"; **seller name + request title**; full message and price | Name + title | Useful enough to act on, without putting the price or chat on a lock screen. |
| Device ownership | Keep the first member forever; **the last member to subscribe owns the device**; turn it off on log out | Last + log out | Shared tablets don't leak another member's offers. |
| Testing | Real push in tests; **fake sender (`setPushSender`)** | Fake | Tests stay offline and fast; real delivery is checked by hand once ([[Push Notifications#Try it (optional, and why https matters)]]). |

## Revisit when
- Members want pushes for deals, ratings or messages → add per-kind switches on the card.
- The app goes to the App Store → native push.
- Lots of members (thousands of pushes a minute) → send from a queue instead of inside the request.
