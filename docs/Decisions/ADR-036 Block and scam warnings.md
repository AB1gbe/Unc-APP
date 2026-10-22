---
tags: [decision, safety]
status: accepted
date: 2026-10-22
---
# ADR-036 Block a member, and scam warnings

See [[Choosing, Alerts and Safety#4. Block a member, and scam warnings]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Who is affected | Only the blocked person can't write; **no new contact either way** | Both ways | A block shouldn't leave the blocker able to poke the other person. |
| Old chats | Delete; hide; **keep readable, replies off** | Readable | Keeps evidence for reports. |
| Telling the blocked person | "You were blocked"; **"You can't reply in this conversation"** | Neutral | Avoids conflict and retaliation. |
| Requests | Hide both ways; **hide the blocked member's requests from the blocker** | One way | The blocker controls what they see; the blocked member doesn't learn about the block from a missing request. |
| Scam detection | On the server, auto-flag or block; **on the device, a warning only** | Warning | No automated reading or punishing of private chats; the person decides. |
| Signals | AI classifier; **simple patterns: pay first, IBAN, links, in English and Arabic** | Patterns | Free, transparent, testable. Revisit if scammers adapt. |
