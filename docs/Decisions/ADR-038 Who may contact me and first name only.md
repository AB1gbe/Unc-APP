---
tags: [decision, privacy]
status: accepted
date: 2026-10-22
---
# ADR-038 Who may contact me and first name only

See [[Privacy, Demand and Trust#1. Who may contact me + show only my first name]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Who sets the rule | Account-wide; **per request** | Per request | A buyer may want shops for a phone but anyone for a used chair. |
| The choices | Free filters; **4 fixed choices (anyone, shops, 4★+, favourites)** | 4 choices | Simple to understand; each is easy to check on the server. |
| "Well rated" | Any rating; **at least 1 visible rating, average 4 or more** | 4★+ | Matches what profiles show; new sellers can still answer "anyone" requests. |
| Sellers who don't qualify | Hide the request; **show it with a 🔒 badge and say why** | Show | Honest, and tells sellers how to qualify. "Requests for you" and alerts do leave it out, so nobody is nagged. |
| Changing the rule later | Close existing chats; **keep them** | Keep | Never cut off a conversation that already started. |
| Name privacy | Nicknames; hide names fully; **first name + initial ("Sam B.")** | Initial | Still feels human; the verified identity behind it is unchanged (KYC). |
| When the full name shows | Never; after a deal; **after you write in that chat** | After you write | You decide by replying; the seller you talk to knows who you are. |
| Shops | Allowed; **not allowed** | Not allowed | A shop is known by its business name. |

**Revisit when:** buyers ask for more rules (e.g. "within my governorate"), or members ask for a nickname instead.
