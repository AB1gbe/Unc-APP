---
tags: [decision, design, navigation]
status: accepted
date: 2026-11-11
---
# ADR-067 App-style side bar

The owner: "I don't like the top bar, it looks bad", then (shown three top-bar designs) "this looks like a website, I need it to look like an app", and "make it expand and close".

| Question | Options | Chosen | Why |
|---|---|---|---|
| Computers | Top bar (A centred tabs, B search on top, C minimal; `docs/attachments/topbar-choices.png`); **side bar like the Instagram/X apps** | Side bar | A top bar reads as a website; apps put navigation in a side rail. |
| Open / closed | Always open; **toggle that folds it to an icon rail, remembered on the device** | Toggle | The owner's request. Stored in `localStorage` (`unc.sidebar`); tooltips show names when folded. |
| Phones | Same side bar as a drawer; **slim header (logo, 🔔, language) + bottom tab bar** | Header + tabs | That is how phone apps look; the tab bar already existed. |
| What's in the side bar | **Home, Requests, Shops, Categories, Messages, Notifications, My requests, Admin (admins), Post a request / Sign up, language, your photo (Account) / Log in** | All | Everything in one place. |
| Arabic | **The side bar moves to the right** | Right | Logical CSS (`inset-inline-start`). |

**Revisit when:** the side bar has too many items (group them), or tablets in landscape need the folded rail by default.
