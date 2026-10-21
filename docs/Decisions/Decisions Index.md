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

Template for new ADRs: copy any ADR and keep the same headings.
