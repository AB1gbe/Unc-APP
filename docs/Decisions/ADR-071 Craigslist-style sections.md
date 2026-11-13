---
tags: [decision, product, safety]
status: accepted
date: 2026-11-13
---
# ADR-071 Craigslist-style sections

The owner: **"We need to shift the app to imitate craigslist more than anything but with safety measures"** (after [[Craigslist Study]]). Answers to the four questions asked:

| Question | Options | Chosen (owner) | Why |
|---|---|---|---|
| What happens to "buyers post requests" | Both, sale ads first; Craigslist only; keep requests, change the look | **Both** | Keeps everything already built; requests become the **Wanted** section. |
| Sections at the start | For sale, Services, Housing, Jobs | **Housing, Jobs** (+ Wanted) | The owner's pick. Craigslist's biggest earners were jobs and housing. |
| Look | Craigslist layout in Unc style; plain like Craigslist; keep current look | **Craigslist layout, Unc style** | Dense lists of sections, categories and ads; Unc's dark theme, fonts, Arabic and phone tab bar stay. |
| Safety | Verified to post; auto-hide on reports; chat only; scam checks | **Verified to post, scam checks** | Fixes Craigslist's weakness (anonymous scams). |

## How it works
- `listings.section` = `wanted` (old requests), `housing` or `jobs` (migration 42). One table, one chat system: replies to an ad are conversations about that ad, as before. Contact outside a listing's chat is still impossible.
- **Verified to post:** already true: posting and replying need a confirmed email + approved ID check (`requireVerified`).
- **Scam checks** (`shared/scam-check.js`, same code in the form and on the server):
  - **refused:** money before a viewing or job start (transfers, gift cards, crypto, "deposit before viewing", visa/training fees), in English and Arabic; phone numbers, links or emails in the ad;
  - **refused:** the same title again within 7 days; more than 5 ads a day;
  - **held for a person to check:** rent far below normal (e.g. a villa under BD 250), pay over BD 3,000 a month, "work from home, no experience", "I'm abroad, keys by courier". Held ads are hidden from everyone but the poster until an admin approves (Admin → Ads to check).
- Who replied to an ad is **not** public (unlike "who answered" on requests): applicants and tenants stay private.

**Not chosen now:** auto-hide on reports, a general "For sale" section, paid ads. **Revisit when:** scams get past the word lists (add report-based hiding), or the owner wants For sale / Services, or charging employers and agents (Craigslist's model).
