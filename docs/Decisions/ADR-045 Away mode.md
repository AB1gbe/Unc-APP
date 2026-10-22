---
tags: [decision, sellers]
status: accepted
date: 2026-10-22
---
# ADR-045 Away mode

See [[Your Data, Dashboard and Care#3. Away mode]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| How long | Open-ended; **until a date, up to 60 days** | Date | It ends by itself; nobody stays "away" forever by mistake. |
| What pauses | Everything; **alerts and favourite heads-ups** | Those two | Chats stay open so people can still reach you about running deals. |
| What others see | Nothing; **"🌴 Away until …"** | Shown | Honest; sets expectations. |
| Reply time | Unchanged; **ignore messages that arrived while away** | Ignore | A holiday shouldn't cost the ⚡ badge. Needs a record of away periods (`away_periods`). |
| Auto-reply | Send a message for you; **no** | No | Messages are written by people; the status line already says it. |

**Revisit when:** shops ask for weekly closed days (that's opening hours, already on shop pages) or an auto-reply.
