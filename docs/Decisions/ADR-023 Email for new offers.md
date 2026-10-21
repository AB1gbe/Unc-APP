---
tags: [decision, email, notifications]
status: accepted
date: 2026-10-21
---
# ADR-023 Email for new offers

Context: "add email notifications for new offers". Builds on [[ADR-011 Email delivery]] and [[ADR-021 Saved requests and notifications]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Default | Off (members opt in); **on (members can opt out)** | On | It's about the member's own request and is the most important event on Unc. One tick box in Account turns it off. |
| How often | Daily digest; one email per offer, but at most one per hour; **one email per new offer** | Per offer | Offers are rare (each seller can contact a request only once), and they are time-sensitive. Revisit if busy requests get many offers. |
| Which events | Every message; **new offers only** | Offers only | Replies happen inside the app; emailing each message would be noise. |
| Content | "You have a new offer, log in to see it"; **seller, request, price, first 300 characters, a button** | Details | The buyer can decide from the inbox. An email is private to the buyer, unlike a lock screen ([[ADR-022 Push notifications]]). |
| Turning it off | Log-in-free unsubscribe link (needs signed tokens); **link to Account → tick box** | Account | Simple and safe. Revisit before sending at scale: Gmail and Yahoo expect a one-click `List-Unsubscribe` header from bulk senders. |
| Sending | Wait for the email before answering; **fire after the offer is saved (`trySendMail`, not awaited)** | Fire | A slow or broken email provider must never slow down or fail an offer. |
| Text direction of member text | `dir="auto"` and `<bdi>`, like the website; **explicit `dir` from the first letter, and Unicode isolates in plain text** | Explicit | Email apps strip or ignore `dir="auto"` and `<bdi>` ([[Mistakes and Fixes#M61]]). |

## Revisit when
- Sending more than ~5,000 emails a day → add `List-Unsubscribe` with signed tokens.
- Requests get many offers at once → combine them into one email ("3 new offers").
