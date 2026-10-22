---
tags: [decision, trust]
status: accepted
date: 2026-10-22
---
# ADR-048 Hide contact details until a price is agreed

See [[Deals, Terms, Cards and Installments#1. Contact details hidden until a price is agreed]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Block or hide | Refuse the message; **send it but hide the details** | Hide | Doesn't break the conversation; the nudge teaches the rule. |
| Until when | Never shown; until "found it"; **until a price is accepted** | Accepted price | People genuinely need to call to arrange pickup once they agree. |
| Where it's checked | Only in the browser; **on the server** | Server | Can't be bypassed; the email and inbox are covered too. |
| What counts | Digits only; **digits (also Arabic and spelled out), emails, links, @handles; not dates or short numbers** | Wide | Catches the common tricks without hiding prices or model numbers. |
| Old messages after agreeing | Stay hidden; **show** | Show | Simple rule: once agreed, everything shows. |
| Counting | No; **yes, per message** | Count | Lets the owner spot repeat offenders later (a human decides). |

**Revisit when:** people find new tricks (add patterns to `shared/contact-mask.js`), or the owner wants repeat attempts flagged automatically.
