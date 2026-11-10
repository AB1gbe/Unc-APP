---
tags: [decision, payments]
status: accepted
date: 2026-11-08
---
# ADR-056 Orders and wallet credit

See [[Orders, Wallet, Invites and Video#1. Orders and the wallet]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| What an "order" is | Only deals marked found; **any chat with an accepted price, or a deal** | Accepted price | That's when both people have agreed; it's what needs following up. |
| Stages | Free text; **agreed / paying / rate / done / ended** | Fixed stages | Clear badges, translated. |
| Wallet money | Real money now; **Unc credit (not money) until Tap is connected** | Credit | Holding real money needs a payment licence/partner; credit can't be withdrawn. |
| Storage | One balance number; **a list of changes (ledger), UNIQUE per reason + ref** | Ledger | Shows the history; rewards can't be doubled. |
| Unit | Decimals; **whole fils (1000 = BD 1)** | Fils | No rounding errors. |

**Revisit when:** Tap is connected (real payments, refunds and payouts in the wallet), or Unc starts charging fees (spend credit on them).
