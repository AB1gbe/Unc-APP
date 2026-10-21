# KYC providers

Every provider is an object with:

- `name` - string stored on each submission (`kyc_submissions.provider`)
- `start(submission)` - called after a submission is saved. Returns
  `{ status: 'pending' | 'approved' | 'rejected', note? }`.

To add an automated provider (Stripe Identity, Persona, Sumsub, Onfido...):

1. Create `yourprovider.js` here exporting the object above. In `start`,
   create a verification session with the provider's API and return
   `{ status: 'pending' }`.
2. Register it in `../index.js`.
3. Add a webhook route that receives the provider's final decision and calls
   `applyDecision(db, submissionId, 'approved' | 'rejected', note)` from
   `../index.js`.
4. Set `KYC_PROVIDER=yourprovider` in the environment.

Full walkthrough: `docs/Features/KYC Verification.md`.
