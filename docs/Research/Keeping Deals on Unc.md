---
tags: [research, business, trust]
date: 2026-10-22
---
# Keeping deals on Unc (stopping "just give me your number")

**The problem:** a buyer and a seller meet on Unc, swap phone numbers in the chat, and finish the deal on WhatsApp. Unc loses the deal record, the rating and the chance to earn from it, and the members lose Unc's protection.

## What Unc does today (checked in the code)
- **Profiles and shop pages** refuse phone numbers, links, emails and @handles (`server/src/lib/contact-guard.js`, session 24).
- **Chat messages are not checked at all.** Anyone can type "call me on 3912 3456" in the first message.
- The **scam warning** (session 31) flags pay-first, IBANs and links, but not phone numbers.
- Unc **takes no money yet**, so today a deal finished on WhatsApp costs Unc nothing directly. It costs data (no "found it", no rating) and trust (no help if it goes wrong).

## The honest truth
No marketplace stops this completely: Airbnb, Upwork, Fiverr and Thumbtack all fight it. People can always write "three nine one two…" or send a photo of a business card. The ones that win do three things together:
1. **Make staying more valuable than leaving** (protection, reputation, convenience).
2. **Add light friction** to leaving early (hide numbers until it makes sense).
3. **Earn money at a point that can't be skipped** (so a deal that leaves doesn't hurt the business).

Point 3 matters most, and it's the owner's decision ⚖️.

## 1. Earn money where leaking doesn't matter ⚖️ (the big decision)
| Model | How it works | Does leaking hurt? |
|---|---|---|
| **Commission on each deal** | Unc takes e.g. 5% of the price | ❌ Badly: every deal finished on WhatsApp is lost money. Only works with in-app payment (below). |
| **Pay per offer (credits)** | A shop pays a small fee (e.g. 200 fils) to send an offer on a request. The Thumbtack / Bayt model | ✅ No: Unc is paid when the seller reaches the buyer, which can only happen on Unc. |
| **Shop subscription** | Shops pay monthly for extras (unlimited offers, dashboard, featured shop page, alerts with more filters) | ✅ No. |
| **Buyer protection fee** | Optional: the buyer pays through Unc (BenefitPay) and the seller is paid after "found it"; a small fee for the protection | ✅ It *rewards* staying: you only get protection on Unc. Needs a licensed payment partner. |

**Recommendation:** for a reverse marketplace, earn at the **contact** (credits or a shop subscription), not the deal. The moment Unc delivers value is "a verified buyer with a real need meets a seller", and that moment always happens on Unc. Add **buyer protection** later as the reason to also *pay* through Unc.

## 2. Make staying worth it (most of this is already built)
| Reason to stay | Status |
|---|---|
| ★ Ratings, ⚡/🏆 badges and "deals done" only count for deals marked on Unc | ✅ built. Make it **visible**: "Deals finished on Unc build your rating" |
| "Something went wrong" help, only for deals on Unc | ✅ built (session 34) |
| Proof photos, offer details (warranty, returns) in writing | ✅ built (session 34) |
| Pickup checklist and big-deal safety card | ✅ built (session 37) |
| **Deal record / receipt** (item, price, warranty, both verified names), downloadable | ⬜ idea (session 30): a warranty claim needs it |
| **Buyer protection** via BenefitPay ⚖️ | ⬜ needs a payment partner |
| **Verified identity** on both sides (KYC): a stranger on WhatsApp has none | ✅ built. Say it in the chat: "Only on Unc do you know they're verified" |

## 3. Light friction (what we can build now)
| Idea | What it looks like | Effort |
|---|---|---|
| **Hide numbers until a price is agreed** | Before an accepted price, phone numbers, emails, links and @handles in chat show as "📵 hidden until you agree a price" (the sender sees a note why). After an accept, people may need to arrange pickup, so numbers show. Airbnb does the same before booking | M |
| **Gentle nudge** | When someone types a number early: "Keep talking here until you agree: your rating, proof photos and our help only work for deals on Unc." | S |
| **Catch the tricks** | Arabic digits (٣٩١٢), spaced digits, "nine one two", "whatsapp me", "واتساب", "رقمي" | S–M |
| **Count attempts** | Each hidden number is counted. Many attempts from one seller → admin flag; repeat offenders lose the ⚡ badge or get a warning | S |
| **Measure the leak** | Owner dashboard: "agreed a price but never marked found" per seller and overall. A seller with many accepted prices and no "found it" is likely finishing elsewhere | S |
| **"Did you get it?" check-in** | 3 days after an accepted price with no "found it": "Did you get it from Riverside? Mark it found to rate them" | S |

## 4. What not to do
- Don't read chats with AI or punish automatically: it's unfair and against the trust promise ([[ADR-036 Block and scam warnings]]).
- Don't block numbers **after** a price is agreed: people genuinely need to call each other at pickup.
- Don't ban people for one number: nudge first, flag repeat patterns for a human.
- Don't promise "we stop all off-platform deals". We can't; promise protection for deals on Unc instead.

## Recommended plan
1. **Now (build):** hide numbers until a price is agreed + the nudge + count attempts (one step).
2. **Now (build):** "Did you get it?" check-in + the leak measure on the owner dashboard.
3. **Decide ⚖️:** how Unc earns: per offer (credits) or a shop subscription. Not a commission per deal unless payments go through Unc.
4. **Later ⚖️:** buyer protection through a licensed BenefitPay partner, plus the downloadable deal record.

## Decisions only the owner can make (⚖️)
- The business model (credits, subscription, commission + payments).
- Whether numbers stay hidden only until a price is agreed (recommended), or until "found it", or always.
- What happens to repeat offenders: a warning, losing badges, or a ban.
