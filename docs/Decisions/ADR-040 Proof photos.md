---
tags: [decision, safety]
status: accepted
date: 2026-10-22
---
# ADR-040 Proof photos

See [[Privacy, Demand and Trust#3. Proof photos with a code]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| How to prove a photo is real | Image search; AI check; **a code written on paper in the photo** | Code on paper | Works with any phone, no outside service, everyone understands it. |
| The code | Random and stored; **made from the chat's id and start time (UNC-####)** | Made from the chat | No new column; it exists only once the chat exists, so old internet photos can't show it. |
| Who checks it | The server (reading text in photos); **the buyer, with a reminder** | The buyer | Simple and honest; the badge says "check that the paper says …". |
| Asking | Free text; **a one-tap "Ask for a proof photo"** | One tap | The seller gets clear steps with the code. One open ask at a time, so no spamming. |
| Storage | Change `messages.kind`; **a new `messages.proof` column** | New column | `kind` has a CHECK that only allows accept/decline; changing it means rebuilding the table. |

**Revisit when:** scammers start faking codes (then make a fresh code per ask), or a reliable text-in-photo check becomes cheap.
