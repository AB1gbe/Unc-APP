---
tags: [decision, help]
status: accepted
date: 2026-11-10
---
# ADR-059 Get Help inside the app

See [[Get Help]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Where help happens | WhatsApp link (like Siin); email address; **in-app questions to the team** | In-app | On record, private, in both languages, and no phone number to publish. |
| Who can talk | Members to each other (community forum); **member ↔ Unc team only** | Team only | Unc's rule: members only talk inside a request's chat. |
| Who answers | A separate help desk tool; **admins on the Admin page** | Admin page | No new accounts or costs; the admins already handle reports there. |
| Limits | None; **3 open questions, 10–2000 characters** | Limits | Stops flooding; long enough to explain a problem. |
| Telling the member | Email; **🔔 notification** (email later) | 🔔 | Uses the existing notifications; email can be added through `trySendMail`. |
| Signed-out visitors | Can send questions; **read the answers, sign in to ask** | Sign in | Keeps spam out; a locked-out member is pointed to "Forgot password?". |

**Revisit when:** there are too many questions for the admins (add saved answers or a help-desk service), or members ask for email or WhatsApp replies.
