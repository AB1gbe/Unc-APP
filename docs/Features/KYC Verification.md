---
tags: [feature, kyc, security]
---
# KYC Verification

**Why:** MUST #1. Decision and options compared: [[ADR-005 KYC approach]].
**Where:** `server/src/routes/kyc.js`, `server/src/kyc/`, `server/src/routes/admin.js`, `client/src/pages/Verification.jsx`, `client/src/pages/admin/KycReview.jsx`.

## The user journey
```
Register ─▶ Email code ─▶ KYC form ─▶ PENDING ─▶ admin approves ─▶ APPROVED (can post + offer + message)
                                         │
                                         └─▶ admin rejects (with reason) ─▶ REJECTED ─▶ resubmit ─▶ PENDING
```
A 3-step progress bar (*Account → Email → Identity*) shows where you are (`Steps` in `VerifyEmail.jsx`).

| Step | Screenshot |
|---|---|
| Email code | ![[02-verify-email.png]] |
| KYC form | ![[03-kyc-form-individual.png]] |
| Pending | ![[04-kyc-pending.png]] |
| Admin queue | ![[05-admin-queue.png]] |
| Admin review | ![[06-admin-review.png]] |

## What the user provides
| Individual | Business (extra) |
|---|---|
| Legal name, date of birth (18+), issuing country | Registered business name |
| ID type: passport / national ID / driver's license | Registration number |
| ID number | Registration document (image **or PDF**) |
| ID front (+ back unless passport) | |
| Selfie (`capture="user"` opens the front camera on phones) | |

## What the server checks (in order)
1. Logged in, email verified, not already pending/approved.
2. All fields valid; age ≥ 18 (`ageOn()` in `validate.js`).
3. Required files present for the chosen ID type / account type.
4. ID number normalised (spaces/dashes removed, upper-case) → HMAC with `SECRET_PEPPER` of `COUNTRY|type|NUMBER` → if another account has a pending/approved submission with the same hash → **409 "already linked to another account"**.
5. **All** files' magic bytes are checked (JPG/PNG/WEBP; PDF only for the business doc) before **any** is saved; then saved with random names to `uploads/kyc/`, and deleted again if the next step fails.
6. In one transaction: atomically switch `users.kyc_status` to `pending` **only if** it is `unverified`/`rejected` (else 409 — stops parallel uploads), insert submission, write `audit_log`. An admin decision only changes the user's status when it is about their **newest** submission.
7. Call the provider's `start()`. Manual provider returns `pending`.

## What the admin does (Admin → Review)
Checklist shown on screen: selfie matches ID photo; name and DOB match; document not expired; nothing looks edited. One-click rejection reasons fill the note. **Approve** or **Reject** calls `applyDecision()`, which updates both the submission and `users.kyc_status` atomically and logs who decided.

## Privacy & security
- KYC files are never publicly served. Only admins, via `/api/admin/kyc/:id/file/:field`; each view is logged.
- Only the last 4 characters of the ID number are stored readable.
- Other members only ever see a **"✓ Verified"** badge — never documents or legal name.
- Before launch: write a retention policy (e.g. delete documents N days after approval) and a privacy notice.

## Adding an automated provider
Example outline for **Stripe Identity** (same shape for Persona/Sumsub/Onfido):
1. Create an account, get a secret key, `npm install stripe --workspace server`.
2. Create `server/src/kyc/providers/stripe.js`:
   ```js
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
   export const stripeProvider = {
     name: 'stripe',
     async start(submission) {
       const session = await stripe.identity.verificationSessions.create({
         type: 'document',
         options: { document: { require_matching_selfie: true } },
         metadata: { submissionId: String(submission.id) },
       });
       // Store session.id and send session.url to the client so the user completes the hosted flow.
       return { status: 'pending', redirectUrl: session.url };
     },
   };
   ```
3. Register it in `server/src/kyc/index.js`: `const PROVIDERS = { manual: manualProvider, stripe: stripeProvider };`
4. Add a webhook route (raw body!) that verifies the Stripe signature, and on `identity.verification_session.verified` / `.requires_input` calls `applyDecision(db, submissionId, 'approved' | 'rejected', note)`.
5. Set `KYC_PROVIDER=stripe`. Update `Verification.jsx` to redirect to `redirectUrl`.
6. Write tests that fake the webhook call.
> This is a plan, not yet built or tested. Record what actually happens in [[Mistakes and Fixes]] when doing it.
