---
tags: [decision, notifications]
status: accepted
date: 2026-10-21
---
# ADR-021 Saved requests and notifications

See [[Saved Requests and Notifications]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Saving | Browser storage; **server table `saved_listings`** | Server | Follows the member to their phone and laptop. |
| Closed saved requests | Delete; show greyed out; **keep the row, hide from the list** | Hide | Clean list; if the buyer reopens it, it comes back. |
| Save your own request | Allow; **refuse (400)** | Refuse | Pointless; keeps the list about other people's requests. |
| Notification events | Everything incl. every message; **only what the Messages badge doesn't cover: new offer, deal picked, rating left, identity approved/rejected** | Limited | Messages already have their own badge; duplicating it is noise. |
| Wording | Stored text; **built in the app from `kind`** | From kind | Shows in the reader's current language (English/Arabic). |
| Delivery | WebSockets; email for each; **poll the count every 15 s** (with the message count) | Poll | Same approach as messages ([[ADR-007 Real-time updates]]); indexed so it costs microseconds. |
| Read state | Per item; **opening the 🔔 page marks all read** | All | Simple; new items stay highlighted while the page is open. |
| Old notifications | Keep forever; **delete read ones after 90 days** (`cleanupExpired`) | 90 days | Keeps the table small. |

## Revisit when
- Members ask for email or phone push for offers → add an opt-in per kind.
