---
tags: [roadmap]
---
# Roadmap

## Before public launch
- [x] Real email sending (SMTP / Resend) → [[Email Sending]] *(session 02)* — still to do: pick a provider and verify your domain
- [ ] Production env vars + HTTPS + backups → [[Deploying to Production]]
- [ ] Privacy policy, terms, KYC data-retention policy (auto-delete documents after N days)
- [x] Password reset by email + change password → [[Password Reset]] *(session 02)*
- [ ] Decide on automated KYC provider → [[KYC Verification#Adding an automated provider]]

## For a Bahrain launch (from [[Bahrain Market Research]])
- [x] Arabic interface with right-to-left layout (plus English) → [[Arabic and RTL]] *(session 12)*
- [ ] BHD currency (3 decimals)
- [ ] BenefitPay payments/deposits via a licensed payment provider
- [ ] Identity via eKey for Business (ask Beyon Connect about eligibility) — document + selfie service until then
- [ ] Shop accounts: CR number checked on Sijilat (status active)
- [ ] PDPL review (consent, data protection officer, where data is hosted)
- [ ] Share a request to WhatsApp / Instagram

## Next features
- [x] Ratings & reviews after a request is fulfilled → [[Ratings]] *(session 09)*
- [ ] Photos in chat messages
- [ ] Email/push notification when a new offer arrives
- [ ] Saved searches for vendors ("notify me of new Electronics requests in Austin")
- [ ] Location with radius instead of free-text city
- [ ] Admin UI for the audit log; promote/demote admins
- [ ] Block a user (stop a specific vendor contacting you again)
- [ ] PWA install + push → [[ADR-001 Platform]]

## Scale-up (only when needed)
- [ ] PostgreSQL → [[ADR-003 Database]]
- [ ] S3-compatible storage with signed URLs → [[ADR-008 File storage]]
- [ ] Server-Sent Events for chat → [[ADR-007 Real-time updates]]
- [ ] Full-text search (SQLite FTS5) once there are ~500k requests → [[ADR-013 Performance]]
- [ ] Bot protection on sign-up (e.g. Cloudflare Turnstile) → [[ADR-014 Rate limiting]]
