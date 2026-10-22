---
tags: [decision, requests]
status: accepted
date: 2026-10-22
---
# ADR-037 "Still looking?" expiry, and tips for quiet requests

See [[Choosing, Alerts and Safety#5. "Still looking?" expiry and tips]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Lifetime | Never expire; 14 days; **30 days** | 30 | Long enough for hard-to-find items; keeps Browse fresh. |
| Warning | None; email; **🔔 + push 3 days before** | 🔔 + push | Reaches the buyer even when the app is closed; email stays for offers. |
| What expiry does | Delete; **close (status `closed`, with `expired_at`)** | Close | Chats and history stay; it can be reopened. |
| Renew | Automatic; **one tap "Keep it open"; reopening also restarts the 30 days** | One tap | The buyer confirms they still want it. |
| Running it | A separate scheduler service; **hourly inside the server, with the other clean-ups** | Hourly | No extra moving parts. |
| Tips | A score; many tips; **at most 2 simple, rule-based tips, only when they apply** | 2 rules | Helpful, not nagging. |
