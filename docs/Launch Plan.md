---
tags: [plan]
date: 2026-11-15
---
# Launch Plan

Why: [[Honest Review 2026-11-15]] point 3 and [[ADR-081 Launch focus]]. A marketplace with no people in it is empty for everyone. Start small, so that the first people find something.

## Where and what
- **Area:** Manama and Juffair first. They're dense, with many expats who rent and buy second-hand.
- **What:**
  - **Wanted** (people say what they need, shops answer). This is Unc's own idea.
  - Plus **one or two** of: Phones, Furniture, Flats for rent.
  - Don't push every category at once.
- **Free for businesses** until there are buyers. Charging stays off: `CHARGE_BUSINESSES` is not set.

## First 30 shops, by hand
1. List 50 phone, furniture and electronics shops in Manama and Juffair, from Google Maps and Instagram.
2. Visit or message them. Offer: "Free: customers tell you what they want, you answer."
3. Help each one sign up (CR + ID check), and check the CR yourself.
4. Post 5–10 real Wanted requests a day in the first weeks, from friends and family, so shops see demand.
5. Every week, look at:
   - which requests got no offer;
   - which shops never answer.

## Things only the owner can do before a real launch
| What | Why it matters | Where |
|---|---|---|
| Real email provider (SMTP / `MAIL_TRANSPORT`) | Sign-up codes and password resets must reach people's inboxes | [[Email Sending]] |
| Tap Payments account | Cards for businesses and paid ads later | [[Business Accounts and Billing]] |
| A lawyer to read the Terms and Privacy pages | Bahrain law (PDPL), selling rules, liability | `client/src/pages/Terms.jsx` |
| Decide where ID photos are kept (PDPL) | ID photos are personal data; Bahrain's law has rules on keeping them and sending them abroad | [[KYC Verification]] |
| SMS provider for phone codes (Twilio or Unifonic) | People selling their own things confirm their phone; without it a real site can't send codes | [[Phone Codes]] |
| An ID-check provider (instead of checking IDs by hand) | Checking by hand doesn't scale and makes mistakes | [[KYC Verification]] |
| Someone reads reports and the review queue **every day** | Scams hidden by reports wait for a person to check them | [[Admin and Moderation]] |
| Weekly backup download | See [[Step 76 - Launch readiness]] | Admin page |
| A real designer for a final pass | The app is consistent now but not designed by a professional | — |

## When to start charging
When there are steady buyers: for example, most Wanted requests get an offer within a day, for a month. Then turn on `CHARGE_BUSINESSES=1` and revisit [[ADR-077 Business accounts, paying for ads and teams]].
