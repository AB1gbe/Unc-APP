---
tags: [decision, payments]
status: accepted
date: 2026-10-22
---
# ADR-052 Paying in parts

See [[Deals, Terms, Cards and Installments#5. Paying in parts]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Who carries the risk | Unc lends (needs a Central Bank licence); an installment partner; **the seller agrees a plan** | Seller plan **for now** | The owner wants a partner later, after approval; a seller plan works today without a licence. |
| Ready for the partner | Separate later; **`provider` column ('seller' now, 'partner' later)** | Column | The partner slots in without changing the design. |
| When | Any time; **after a price is accepted** | After agreeing | The amount is known and both agreed the deal. |
| Plan shape | Free amounts; **2–6 equal parts, weekly / 2-weekly / monthly, first within 30 days** | Simple | Easy to understand and to remind. |
| Proof of each payment | Unc checks the bank; **buyer "I've paid", seller "Received"** | Both confirm | No money through Unc; both sides agree. |
| Reminders | None; **day before, and both sides at 3 days late** | Both | Keeps it honest without spam. |
| Card on file | Charge it for missed parts; **not yet** | Not yet | Needs Tap connected, legal advice and clear consent. |

**Revisit when:** the installment partner approves Unc (add `provider = 'partner'`), or Tap is connected (consider charging missed parts, with legal advice).
