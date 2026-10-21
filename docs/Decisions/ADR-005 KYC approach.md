---
tags: [decision, kyc, security]
status: accepted
date: 2026-10-21
---
# ADR-005 KYC: manual review now, provider plug-in ready

## Context
MUST #1 is "proper KYC". Proper KYC means: confirm a **real government ID**, confirm the **person holding the account is the person on the ID** (selfie), confirm **age**, and stop **one person running many accounts**. For businesses, also confirm the **business exists**.

## Options considered
| Option | How it works | Cost (approx., check current pricing) | Pros | Cons |
|---|---|---|---|---|
| **Manual review** ✅ (built) | User uploads ID + selfie; an admin compares them | Staff time only | No contracts, works today, full control, easy to replicate | Doesn't scale past a few hundred/day; humans miss good forgeries; no liveness check |
| Stripe Identity | Hosted flow: ID scan + selfie liveness, webhook result | ~$1.50 per check | Very easy if you'll use Stripe for payments; strong fraud checks | Needs Stripe account; country coverage limits |
| Persona | Hosted/embedded flows, very configurable | Free tier then per-check | Flexible, good dashboard | More setup |
| Sumsub / Onfido / Veriff | Enterprise KYC/AML, watchlists, business KYB | Per check, often contracts | Global coverage, AML screening | Sales process, heavier integration |

## Decision
1. Build **manual review** as the default provider so the app is fully functional with zero contracts.
2. Put all provider logic behind a tiny interface (`server/src/kyc/`): `start(submission)` + one shared `applyDecision()` function. Any automated provider plugs in without touching routes or the UI's status model.
3. Gate everything important on `kyc_status = 'approved'`: posting requests, making offers, sending messages.

## Safeguards built into the manual flow
- Must verify email before KYC.
- 18+ check from date of birth.
- Passport needs 1 photo; national ID / driver's license need front **and** back.
- Business accounts must also upload a registration document (image or PDF) and give registration number.
- Uploaded files checked by **magic bytes**, not filename (a renamed script is rejected).
- ID number never stored in full: only **last 4** (for the reviewer) + a **peppered HMAC** of `country|type|number` to detect the same ID on two accounts ("one person = one account").
- KYC files stored in a private folder, only streamable by admins through a permission-checked route; every view is written to `audit_log`.
- Rejections require a reason that the user sees; they can resubmit. Reviewers see earlier attempts.

## Revisit when
More than ~50 verifications a day, or fraud appears → add Stripe Identity or Persona (step-by-step in [[KYC Verification#Adding an automated provider]]).
