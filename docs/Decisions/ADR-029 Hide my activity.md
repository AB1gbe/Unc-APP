---
tags: [decision, privacy]
status: accepted
date: 2026-10-21
---
# ADR-029 "Hide when I'm online"

Context: "add the hide my activity setting", the open point from [[ADR-026 Activity and privacy]]. See [[Social Touches#3. "Active now", reply time, "people looked at it"]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| What it hides | Everything (online status, reply time, badges); **online status only ("Active now" / "Active … ago")** | Online status | That's the part that tracks a person. Reply time and badges are earned from how they behave in chats and help others trust them. |
| Hide, or stop storing? | Keep recording but don't show it; **clear the stored time and stop recording it** | Stop storing | Nothing to leak, and it matches what the switch promises. Still filtered in `summaryFor` as a second safety net. |
| Fair-play rule (like WhatsApp: hide yours → you can't see others') | Yes; **no** | No | Simpler; the information is small. Revisit if members ask for it. |
| Default | On; **off** | Off | Presence is part of the social feel ([[Social Touches]]); everyone can switch it off in one tap. |
| Where | A separate privacy page; **a "Privacy" card on Account** | Account card | Next to the other switches. |

## Revisit when
- More privacy options (hide city, hide from search) → a full Privacy page.
- The PDPL review before launch asks for more.
