---
tags: [decision, safety]
status: accepted
date: 2026-10-22
---
# ADR-046 Pickup checklist and big-deal card

See [[Your Data, Dashboard and Care#4. Pickup checklist and big-deal safety card]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| When it shows | Always; **after a price is accepted, or a deal** | After agreeing | That's when people meet. |
| Lists | One for all; **by category, plus common checks** | By category | Phones and sofas need different checks. |
| Where ticks are kept | Server; **this device (localStorage)** | Device | Private notes; nothing to store or leak. Lost on another device, which is fine. |
| Big deal limit | One number; **per currency** | Per currency | 500 USD and 200 BHD are similar amounts. |
| Tone | Warnings; **friendly tips** | Tips | Helpful, not scary. |

**Revisit when:** BHD becomes the default currency (check the limit), or a category needs its own list.
