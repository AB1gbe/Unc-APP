---
tags: [decision, payments]
status: accepted
date: 2026-10-22
---
# ADR-051 Payment card when joining

See [[Deals, Terms, Cards and Installments#4. Payment card when joining]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| When a card is needed | Only for installments; **for everyone, when joining** | Everyone | The owner's choice: people who cheat can be held to the Terms. |
| Where it fits | At registration; **after the identity check, before posting/offering** | After KYC | Sign-up stays quick; nobody acts without one. |
| Card numbers | Store them; **never: only the payment company's token, brand, last 4, expiry** | Token | Card rules (PCI DSS); a leak can't expose cards. |
| Provider | Stripe (not for Bahrain merchants); **Tap Payments**, test mode until approved | Tap | Bahrain/Gulf, BenefitPay, saved cards. Owner's choice. |
| Showcase | A fake page; **a working test provider (`PAYMENT_PROVIDER=test`) with a declined card** | Test provider | Shows the whole flow now; swapping to Tap changes one setting and the card form. |
| Charging | Charge now; **nothing charged** | Nothing | Charging a card for a broken rule needs clear Terms, the provider's rules and the member's consent; later. |

**Revisit when:** the Tap account is approved: build `providers.tap` in `server/src/lib/payments.js` (create a Tap customer, save the card from Tap's token, a zero-amount check) and load Tap's card form on `/payment-card`.
