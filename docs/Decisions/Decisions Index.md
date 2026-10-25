---
tags: [decisions, index]
---
# Decisions Index

Each ADR (Architecture Decision Record) answers: **What did we decide? What else did we consider? Why this one? What would make us change our mind?**

| # | Decision | Chosen | Options considered |
|---|---|---|---|
| 001 | [[ADR-001 Platform]] | Responsive web app | Native iOS/Android, React Native, PWA, web |
| 002 | [[ADR-002 Tech stack]] | Node + Express API, React + Vite client | Next.js, Django, Laravel, Rails, Express+React |
| 003 | [[ADR-003 Database]] | SQLite via built-in `node:sqlite` | PostgreSQL, better-sqlite3, Prisma ORM, MongoDB |
| 004 | [[ADR-004 Authentication]] | Cookie sessions + scrypt | JWT, Auth0/Clerk, Passport.js |
| 005 | [[ADR-005 KYC approach]] | Manual review + provider interface | Stripe Identity, Persona, Sumsub, Onfido, Veriff |
| 006 | [[ADR-006 Messaging model]] | Conversations keyed by (listing, vendor) | Free DMs + tag, listing comments, per-listing group chat |
| 007 | [[ADR-007 Real-time updates]] | Polling (4 s chat, 15 s badge) | WebSockets/Socket.IO, Server-Sent Events, Firebase |
| 008 | [[ADR-008 File storage]] | Local disk, KYC folder private | S3/R2, database BLOBs, Cloudinary |
| 009 | [[ADR-009 Styling approach]] | One plain CSS file with tokens | Tailwind, MUI/Chakra, CSS modules |
| 010 | [[ADR-010 Testing]] | node:test + supertest; Playwright smoke | Jest, Vitest, Cypress, manual only |
| 011 | [[ADR-011 Email delivery]] | SMTP via nodemailer + Resend API option | Provider SDKs, self-hosted mail, SMTP, HTTP API |
| 012 | [[ADR-012 Password reset design]] | Single-use emailed link, 30 min | 6-digit code, security questions, SMS, admin reset |
| 013 | [[ADR-013 Performance]] | Measure; indexes + query rewrite, gzip, long caching, lazy pages, pause hidden polling | in-memory caches, counter columns, Brotli, preact, FTS |
| 014 | [[ADR-014 Rate limiting]] | Per-action limiters + `TRUST_PROXY` | shared limiter, per-email limits, hosted bot protection |
| 015 | [[ADR-015 Ratings]] | Deal-based, two-way, blind 1–5 stars | anyone rates, one-way, thumbs, visible at once, editable |
| 016 | [[ADR-016 Live preview while building]] | Auto-pull on the owner's PC (`npm run live`) | public tunnel, screenshots only, deploy every step |
| 017 | [[ADR-017 Arabic and RTL]] | Custom `t()` keyed by English, `dir=rtl` + logical CSS, server translates by `Accept-Language`, Western digits | i18next, FormatJS, ID keys, Arabic-Indic digits, separate RTL CSS |
| 018 | [[ADR-018 Profiles and onboarding]] | Optional profile photo (never the KYC selfie), bio, interests from categories, one skippable welcome step, personal home | profiles table, free-text tags, no onboarding, long wizard |
| 019 | [[ADR-019 Phones, tablets and PWA]] | Responsive site + manifest, bottom tab bar under 900 px, 44 px touch targets, `e2e:devices` check | native app, hamburger menu, 760 px breakpoint |
| 020 | [[ADR-020 Photos in chat and requests]] | Chat photos private to the conversation; 6 public request photos; shrink in the browser | public chat photos, server-side resizing, several per message |
| 021 | [[ADR-021 Saved requests and notifications]] | Saved list on the server; 🔔 for offer/deal/rating/identity only, polled every 15 s | browser storage, notify every message, WebSockets |
| 022 | [[ADR-022 Push notifications]] | Web Push (`web-push`), auto-generated VAPID keys, new offers only, name + title on the lock screen, off on log out | native app, SMS, email, WhatsApp, every event |
| 023 | [[ADR-023 Email for new offers]] | On by default with a switch in Account; one email per offer with details; sent without waiting; explicit text direction | opt-in, digest, every message, link-free unsubscribe, dir=auto |
| 024 | [[ADR-024 Warm wording and celebrations]] | Own confetti (no library), respects reduced motion, seasons from the Umm al-Qura calendar, grey placeholders | library, date table, spinner |
| 025 | [[ADR-025 Offer answers in the chat]] | Accept/decline = a marked message for the newest price only; either side can counter; quick replies fill the box | accept closes the request, offers table, send immediately |
| 026 | [[ADR-026 Activity and privacy]] | "Active now" for members only, rough times, median reply time (3+), distinct views shown to the buyer only | public activity, exact times, average, "who viewed you" |
| 027 | [[ADR-027 Link previews]] | Server adds Open Graph tags per request (buyer's language, first photo); phone share sheet or WhatsApp/Copy | SSR, prerender service, generated images |
| 028 | [[ADR-028 Stories and badges]] | Opt-in story per side per deal, author delete, admin hide; badges computed from deals/ratings/reply time | anyone posts, pre-approval, paid or hand-picked badges |
| 029 | [[ADR-029 Hide my activity]] | Hide online status only; clear and stop storing the last visit; off by default; Account card | hide everything, hide but keep storing, WhatsApp-style fair-play rule |
| 030 | [[ADR-030 Shop pages]] | Business profile = shop page; cover, area + map link, structured hours with "Open now"; no contact fields and a guard on public text | separate shop page, phone/website fields, embedded map, free-text hours |
| 031 | [[ADR-031 Happening near you]] | Finds (anonymous, city + category), new requests, new shops, daily offers count; own city first; never invented; time indexes | named finds, request titles, map distance, live updates, filler activity |
| 032 | [[ADR-032 Favourite sellers]] | ♥ = heads-up when you post in their categories (🔔 + push), answered via the request; verified sellers; public count only | direct messages, all favourites, names public |
| 033 | [[ADR-033 Compare offers]] | Cards (not a table), latest/agreed price, buyer only, from 2 offers, one API call | table, first price, separate page |
| 034 | [[ADR-034 Request alerts]] | Words + category + city/governorate + min budget; instant 🔔 + push; one notification per request; max 10 | search-only, digest, unlimited |
| 035 | [[ADR-035 Bahrain areas]] | Free text tidied to known areas; one shared file; datalist suggestions; governorate = near; translated names | strict list, DB table, select box |
| 036 | [[ADR-036 Block and scam warnings]] | Block = no contact either way, old chats readable, neutral notice; scam = on-device warning from simple patterns | one-way block, delete chats, server flagging, AI |
| 037 | [[ADR-037 Expiry and tips]] | Close after 30 days, 🔔 + push 3 days before, one-tap keep open, hourly; at most 2 rule-based tips | never expire, 14 days, auto-renew, scores |
| 038 | [[ADR-038 Who may contact me and first name only]] | Per request: anyone / shops / 4★+ / favourites; 🔒 badge + reason; "Sam B." until you write in a chat; not for shops | account-wide, hide requests, nicknames |
| 039 | [[ADR-039 Unmet demand board]] | Verified members; counts per category, waiting first, words from 2+ requests; 30 days; by governorate | show requests, AI topics, all time |
| 040 | [[ADR-040 Proof photos]] | Code on paper (UNC-#### from the chat); buyer checks; one-tap ask; new `messages.proof` column | image search, AI, stored random code |
| 041 | [[ADR-041 Offer details]] | Fixed choices for condition/warranty/returns + optional valid-until (≤60 days); expired = no Accept | free text, both sides |
| 042 | [[ADR-042 Closing note and deal problems]] | 🔔-only thank-you when an open request closes; deal problem = a report with `deal_id` + `kind`; other side not told | push/email, new table, email support |
| 043 | [[ADR-043 Download and delete my data]] | JSON export of my data only; delete after 7 days with undo; chats stay as "Deleted member"; banned ID fingerprints kept | instant delete, PDF/CSV, forget banned IDs |
| 044 | [[ADR-044 Owner dashboard]] | Own tables, 7/30/90 days, % answered (≥1 day old), median time to first offer, plain HTML bars + table | analytics service, averages, chart library |
| 045 | [[ADR-045 Away mode]] | Until a date (≤60 days); alerts + heads-ups pause; "🌴 Away until"; away periods don't count in reply time | open-ended, auto-reply |
| 046 | [[ADR-046 Pickup checklist and big-deal card]] | After an accepted price; lists by category; ticks on the device; big-deal limit per currency | server-stored ticks, one list |
| 047 | [[ADR-047 Report follow-up and raise my budget]] | Reporter told "took action"/"found nothing" only; raise budget once a day, tells interested sellers via 🔔 | details, push, unlimited |
| 048 | [[ADR-048 Hide contact details until a price is agreed]] | Send but show 📵 to the other person until a price is accepted; checked on the server; numbers (also Arabic/spelled), emails, links, handles; attempts counted | block, hide forever, browser-only |
| 049 | [[ADR-049 Did you get it]] | Ask the buyer once, 3 days after an accepted price, 🔔 only | both sides, repeat, push |
| 050 | [[ADR-050 Terms of use]] | Draft Terms with "deals agreed on Unc are finished on Unc"; tick at sign-up, banner for existing members, reminder at Accept; versioned | footer link only, final text without a lawyer |
| 051 | [[ADR-051 Payment card when joining]] | Everyone adds a card after KYC; token only (never the number); Tap Payments, showcase test provider until approved; nothing charged | card only for installments, storing numbers, Stripe |
| 052 | [[ADR-052 Paying in parts]] | Seller-agreed plan now (2–6 parts, both confirm each, reminders); `provider` ready for an installment partner later | Unc lends (licence), partner now |
| 053 | [[ADR-053 Free phone testing with a tunnel]] | Free test on a phone: `npm run build` + `npm start` + Cloudflare quick tunnel (https); PWABuilder for a test APK | same Wi-Fi http, free hosting, ngrok |

Template for new ADRs: copy any ADR and keep the same headings.
