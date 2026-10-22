---
tags: [decision, safety]
status: accepted
date: 2026-10-22
---
# ADR-042 Closing note and deal problems

See [[Privacy, Demand and Trust#5. Thank-you note to other sellers, and deal problems]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Telling the other sellers | Nothing (the chat just goes read-only); **a short 🙏 notification** | Notification | Fair and human; sellers stop waiting. |
| When | Every status change; **only when an open request closes** (found, closed, or after 30 days) | On closing | No repeats when a deal is changed later. |
| How loud | Push + email; **🔔 only** | 🔔 only | Not urgent; push is kept for things that need action. |
| Deal problems | Email support; **an in-app form on the deal** | In-app | It already knows the deal and chat; admins read that chat through the report. |
| Where it goes | A new table; **the existing reports, plus `deal_id` and `kind`** | Reports | Reuses the admin screen and the rule that admins read chats only through a report. |
| Telling the other person | Yes; **no** | No | Avoids conflict; the team decides what to do. |
| Repeats | Unlimited; **one open report per person per deal** | One open | No flooding; after it's resolved you can write again. |

**Revisit when:** the team needs to answer inside the app (then add a support thread), or problems need a time limit (e.g. within 30 days of the deal).
