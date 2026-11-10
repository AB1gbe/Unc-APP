---
tags: [decision, photos]
status: accepted
date: 2026-11-08
---
# ADR-058 Short videos in chats

See [[Orders, Wallet, Invites and Video#3. Short videos with offers and in chats]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Where | Public on requests; **only in chats and offers** | Chats | Unc's rule: contact and items stay private to the request's chat. |
| Length / size | Unlimited; **1 minute, 25 MB** | Short | Enough to show an item working; keeps the server small. Photos stay at 5 MB. |
| Formats | Any; **MP4, MOV (iPhone), WebM, checked by first bytes** | Checked | A renamed file can't pass as a video. |
| Shrinking | Re-encode on the server (needs extra software); **no** | No | Simple; the 25 MB cap does the job. |
| Who can play | Anyone with the link; **the chat's two members (admins via a report)** | Members | Same rules as chat photos. |

**Revisit when:** files get large (move to cloud storage with signed links, [[ADR-008 File storage]]), or sellers ask for longer clips.
