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
- [x] Member profiles: photo, bio, interests, welcome step *(session 13)*
- [x] Member home page: needs attention, your requests, requests for you *(session 13)*
- [x] Photos in chat messages (private) + up to 6 request photos, full-screen viewer *(session 13)*
- [x] Saved requests (♡ Save) *(session 13)*
- [x] In-app notifications 🔔 (offers, deals, ratings, identity result) *(session 13)*
- [x] Push notification to the phone when a new offer arrives (session 15) — [[Push Notifications]]. Email for new offers: done in session 17 ([[Email Sending#The new-offer email (session 17)]]).
- [ ] Saved searches for vendors ("notify me of new Electronics requests in Austin")
- [ ] Location with radius instead of free-text city
- [ ] Admin UI for the audit log; promote/demote admins
- [ ] Block a user (stop a specific vendor contacting you again)
- [x] Works on phones/tablets + "Add to Home Screen" (manifest, icons, bottom tab bar) → [[ADR-001 Platform]] *(session 13)*
- [ ] Offline support (service worker exists since session 15, but caches nothing yet) → [[ADR-001 Platform]]
- [ ] Push for more events (deal, rating, identity result), with a per-kind on/off — [[ADR-022 Push notifications]]

## Making it feel social and human (ideas, session 19)
- [x] The recommended first five, built in session 20 → [[Social Touches]].
- [ ] More from [[Social Marketplace Ideas]]: shop pages, "Happening near you" feed, reactions, typing indicator, favourite sellers, city pages, "Me too".
- [x] "Hide when I'm online" switch (session 22) → [[ADR-029 Hide my activity]].

## Scale-up (only when needed)
- [ ] PostgreSQL → [[ADR-003 Database]]
- [ ] S3-compatible storage with signed URLs → [[ADR-008 File storage]]
- [ ] Server-Sent Events for chat → [[ADR-007 Real-time updates]]
- [ ] Full-text search (SQLite FTS5) once there are ~500k requests → [[ADR-013 Performance]]
- [ ] Bot protection on sign-up (e.g. Cloudflare Turnstile) → [[ADR-014 Rate limiting]]
