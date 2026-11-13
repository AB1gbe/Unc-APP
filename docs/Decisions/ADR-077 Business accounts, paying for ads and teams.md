---
tags: [decision, business, billing]
status: accepted
date: 2026-11-13
---
# ADR-077 Business accounts, paying for ads and teams

The owner: "When a business creates an account it has its own admin panel etc. For a business the requirement is **CR**, and we want to do like Craigslist: **take money from the businesses**." (How Craigslist does it: [[Craigslist Study#7. How Craigslist charges businesses (session 88)]].)

| Question | Options | Chosen (owner) | Why |
|---|---|---|---|
| Business requirement | Any registration number; **Bahrain CR from Sijilat** | CR, written 12345-1, one Unc account per CR, CR certificate uploaded | Bahrain businesses all have a CR; checking the format and uniqueness stops fake and duplicate shops. |
| How businesses pay | **Per ad + packs**; monthly plan; both | Per ad + packs | Like Craigslist: pay only when you post; packs (like Craigslist's blocks) give a bonus. |
| Prices | | For sale **BD 1**, Housing **BD 3**, Jobs **BD 5** per ad. Packs: pay BD 10 get BD 11, BD 25 → BD 28, BD 50 → BD 57.5 | Close to Craigslist's dealer/broker/jobs fees; easy to change in `server/src/lib/billing.js`. |
| Offers on Wanted requests | Free; small fee | **Free** | More shops answer, buyers get more choice; money comes from ads. |
| What people pay | | **Nothing** | Craigslist's model: people free, businesses pay. |
| Business panel | Dashboard, Manage ads, Billing, Team members | **All four** | |
| How team members work | Shared password; staff accounts linked to the business; **staff "switch to" the business with their own login** | Switch | Everything already built (chat, posting, offers) works unchanged; the owner's private things (password, card, ID check, buying, team) stay owner-only; every action records who did it. |

How a business ad is paid: ad credit first; if too low, the saved card is charged for that ad **before** it is saved (a declined card creates nothing). Each card payment gets a receipt (UNC-2026-000123) with the business name and CR. No refunds (like Craigslist).

**Not real money yet:** the payment company is the showcase "test" provider; `tap` (Tap Payments) needs a merchant account and TAP_SECRET_KEY. Prices and VAT on receipts need checking with an accountant before launch.

**Revisit when:** connecting Tap; if businesses ask for a monthly plan; when VAT registration applies.
