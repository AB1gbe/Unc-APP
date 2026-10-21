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

Template for new ADRs: copy any ADR and keep the same headings.
