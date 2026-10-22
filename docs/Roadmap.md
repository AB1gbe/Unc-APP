---
tags: [roadmap]
---
# Roadmap

## Before public launch
- [x] Real email sending (SMTP / Resend) → [[Email Sending]] *(session 02)* — still to do: pick a provider and verify your domain
- [ ] Production env vars + HTTPS + backups → [[Deploying to Production]]
- [ ] Privacy policy, terms, KYC data-retention policy (auto-delete documents after N days). *Download my data + delete my account: done in session 37 ([[ADR-043 Download and delete my data]]).*
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
- [x] Saved searches for vendors → request alerts (session 31) — [[Choosing, Alerts and Safety]]
- [x] Bahrain governorates and areas, tidied city names (session 31). Radius/map: still open.
- [ ] Admin UI for the audit log; promote/demote admins
- [x] Block a user (session 31) — [[Choosing, Alerts and Safety]]
- [x] Works on phones/tablets + "Add to Home Screen" (manifest, icons, bottom tab bar) → [[ADR-001 Platform]] *(session 13)*
- [ ] Offline support (service worker exists since session 15, but caches nothing yet) → [[ADR-001 Platform]]
- [ ] Push for more events (deal, rating, identity result), with a per-kind on/off — [[ADR-022 Push notifications]]

## Making it feel social and human (ideas, session 19)
- [x] The recommended first five, built in session 20 → [[Social Touches]].
- [x] Shop pages (session 24) → [[Shop Pages]].
- [x] "Happening near you" feed (session 26) → [[Social Touches#6. "Happening near you" (session 26)]].
- [x] Favourite sellers (session 28) → [[Social Touches#7. Favourite sellers (session 28)]].
- [ ] More from [[Social Marketplace Ideas]]: reactions, typing indicator, favourite sellers, city pages, "Me too".
- [x] "Hide when I'm online" switch (session 22) → [[ADR-029 Hide my activity]].

## More ideas (session 30)
- [x] The recommended next five, built in session 31 → [[Choosing, Alerts and Safety]].
- [ ] More from [[More Ideas for the Vision]] (the rest of the list).

## Fresh ideas (session 33)
- [x] The recommended next five, built in session 34 → [[Privacy, Demand and Trust]].
- [ ] More from [[Fresh Ideas for the Vision]] (shopping lists, borrow/rent, swap, group requests, quiet hours…).

## New directions (session 36)
- [x] The recommended next five, built in session 37 → [[Your Data, Dashboard and Care]].
- [ ] More from [[New Directions for the Vision]] (usually in stock, more languages, hold it for me, WhatsApp alerts…).

## Scale-up (only when needed)
- [ ] PostgreSQL → [[ADR-003 Database]]
- [ ] S3-compatible storage with signed URLs → [[ADR-008 File storage]]
- [ ] Server-Sent Events for chat → [[ADR-007 Real-time updates]]
- [ ] Full-text search (SQLite FTS5) once there are ~500k requests → [[ADR-013 Performance]]
- [ ] Bot protection on sign-up (e.g. Cloudflare Turnstile) → [[ADR-014 Rate limiting]]
