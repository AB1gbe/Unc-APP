---
tags: [feature, trust, payments]
---
# Keeping deals on Unc: hidden numbers, "Did you get it?", Terms, card, paying in parts (session 40)

Built in [[2026-10-22 Session 40]], after the research in [[Keeping Deals on Unc]]. Goal: deals that start on Unc finish on Unc, and people who cheat can be held to account.

## 1. Contact details hidden until a price is agreed
**Why:** [[ADR-048 Hide contact details until a price is agreed]] · **Build:** [[Step 48 - Hide contact details until a price is agreed]]
**Where:** `shared/contact-mask.js`, `server/src/routes/conversations.js`, `client/src/components/ContactNudge.jsx`

![[s40-contact-nudge.png]]

- Until a price is **accepted** in a chat, the other person sees **📵** instead of:
  - phone numbers (any spacing, Arabic digits, or spelled out like "three nine one two…");
  - emails, links (wa.me, instagram…) and @handles.
- Dates and prices are not hidden.
- It covers the chat, the inbox preview, Compare offers and the new-offer email.
- The sender sees their own text, with "📵 Hidden from … until you agree a price".
- **While typing** a number, a yellow nudge explains why. Sending still works.
- After a price is accepted everything shows (people need to arrange pickup), and the chat reloads to show the earlier numbers.
- Every attempt is counted (`messages.had_contact`) for the owner.

## 2. Did you get it
**Why:** [[ADR-049 Did you get it]] · **Build:** [[Step 49 - Did you get it]]
**Where:** `askDidYouGetIt()` in `server/src/lib/notify.js` (hourly)

- 3 days after a price is accepted, if the request is still open, the buyer gets one 🔔: "Did you get “…” from Riverside? Mark it found so you can rate each other."

## 3. Terms of use
**Why:** [[ADR-050 Terms of use]] · **Build:** [[Step 50 - Terms of use]]
**Where:** `client/src/pages/Terms.jsx` (`/terms`), `server/src/lib/terms.js`

![[s40-terms.png]]

- A **draft** Terms page (English and Arabic), clearly marked for a lawyer in Bahrain to review before launch. Section 4: **deals agreed on Unc are finished on Unc**.
- New members tick **"I agree to the Terms…"** to sign up.
- Members who joined earlier see a banner and must press **I agree** before they can post, offer or answer.
- Next to **Accept** on every price: "Accepting means you both finish this deal on Unc (Terms of use)".
- Changing the Terms later: raise `TERMS_VERSION` and everyone is asked again.

## 4. Payment card when joining
**Why:** [[ADR-051 Payment card when joining]] · **Build:** [[Step 51 - Payment card when joining]]
**Where:** `client/src/pages/PaymentCard.jsx` (`/payment-card`), `server/src/lib/payments.js`, Account → **Payment card**

![[s40-payment-card.png]]

- Joining is now: account → email → profile → identity check → **payment card**. Posting, offering and answering need a card.
- **Showcase mode** (`PAYMENT_PROVIDER=test`, the default):
  - no real card is checked or charged;
  - `4242 4242 4242 4242` works, and `4000 0000 0000 0002` shows "declined";
  - the card number never leaves the browser: the page makes a token and sends only that.
- With **Tap Payments** later (`PAYMENT_PROVIDER=tap`): Tap's own card form replaces this one and returns the token. Unc keeps only brand, last 4 digits and expiry, never the number.

## 5. Paying in parts
**Why:** [[ADR-052 Paying in parts]] · **Build:** [[Step 52 - Paying in parts]]
**Where:** `server/src/routes/installments.js`, `server/src/lib/installments.js`, `client/src/components/PlanCard.jsx` (in the chat)

![[s40-plan.png]]

- After a price is accepted, either side taps **💳 Pay in parts?**: 2–6 payments, every week, 2 weeks or month, and a first date (within 30 days). Equal parts; any remainder goes on the first one.
- The other person **accepts** or says no.
- For each part: the buyer taps **"I've paid this"**, the seller taps **"Received ✓"**. A bar shows how much is paid. When all are received, the plan is **All paid ✓**.
- Reminders: the buyer the day before a part is due; **both** when a part is 3 days late (marked **Late**).
- Money goes **directly between them**. Unc records and reminds but does not lend (Terms section 5).
- **Later:** an installment partner (e.g. Tabby/Tamara, if approved for Bahrain) as `provider = 'partner'`, so the seller is paid in full. See the Roadmap.
