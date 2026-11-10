---
tags: [feature, help, admin]
date: 2026-11-10
---
# Get Help (session 60)

**Why:** Siin sends people to WhatsApp when they need help ([[Siin Competitor Study]], idea 6). Unc keeps help **inside the app**, so questions are on record, private, and in English or Arabic.

## What members see — `/help`
- **Common questions** in five groups: Getting started · Offers and deals · Safety · Payments and paying in parts · Account and data. Each is a fold-out question (`<details>`). Anyone can read them, signed in or not.
- **Contact the Unc team** (signed-in members): choose a topic (My account, Identity check, Offers and deals, Payments, Safety or a report, Something else) and write the question (10–2000 characters).
- **Your questions**: each question shows its thread. The status is *Waiting for the team*, *Answered* or *Closed*. Members can add a message (which puts it back in the queue) or press **My question is solved**.
- When the team answers, the member gets a 🔔 notification "The Unc team answered your question." that opens `/help`.
- Links: Account → **❓ Get help**; the sign-in page → "Trouble signing in? Get help".

## What admins see — Admin page → "Help questions"
- Tabs: Waiting · Answered · Closed. The oldest waiting question is first.
- Each question shows the member's name and email, the topic and the thread. Admins can **Send answer** or **Close** it.
- The admin stats tiles include **Help questions** (how many are waiting).
- Answers and closes are written to the audit log (`support.replied`, `support.closed`).

## Rules
- This is **member ↔ Unc team only**. Members never see each other's questions, so the rule "no messaging outside a request's chat" still holds ([[ADR-059 Get Help inside the app]]).
- At most **3 open questions** per member (open or answered), to stop flooding.
- A closed question can't get new messages, from the member or the team; the member asks a new one.
- "Download my data" includes the questions (`helpQuestions`). Deleting the account removes them.

## Where the code is
| Part | File |
|---|---|
| Tables (migration 38) | `server/src/db.js` → `support_tickets`, `support_messages` ([[Database Schema]]) |
| API | `server/src/routes/support.js`, mounted at `/api/support` ([[API Reference]]) |
| Notification kind | `support-reply` in `server/src/lib/notify.js`; wording in `client/src/pages/Notifications.jsx` |
| Export / delete | `server/src/lib/deletion.js` |
| Page | `client/src/pages/Help.jsx` (route `/help` in `client/src/App.jsx`) |
| Admin | `HelpQueue` and `HelpTicket` in `client/src/pages/admin/AdminHome.jsx` |
| Styles | `.help-faq`, `.help-ticket`, `.help-msg` at the end of `client/src/styles.css` |
| Arabic | `client/src/locales/ar.js` ("Get Help (session 60)"), server messages in `server/src/lib/i18n.js` |
| Tests | `server/test/support.test.js`; `e2e/smoke.mjs` (ask → admin answers → 🔔 → answer shown); `/help` in `e2e/devices.mjs` |

## Changing the questions
Edit the `FAQ` list at the top of `client/src/pages/Help.jsx` and add the Arabic for every new sentence to `client/src/locales/ar.js`. Then run `npm test` (the coverage test lists anything missing).

## Later
- Email the member when the team answers (through `trySendMail`, wording in `server/src/lib/emails.js`).
- Saved answers for common questions on the admin side.
