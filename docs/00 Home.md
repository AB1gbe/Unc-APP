---
tags: [home, index]
updated: 2026-10-21 (session 05)
---
# Unc — Project Vault

> **Unc** is a *reverse marketplace*. Instead of sellers posting items, **buyers post what they want** ("Looking for a used PS5"). Verified shops and freelancers (people who find items for others) then **contact the buyer privately about that specific request**.

This vault is the complete record of the project: **how** everything was built, **why** each choice was made, **where** the code lives, every **option** considered, and every **mistake** made and how it was fixed. It is written so you can rebuild the whole app **without an AI**.

## How to use this vault
1. Install [Obsidian](https://obsidian.md) (free).
2. Obsidian → *Open folder as vault* → choose the `docs` folder of this repository.
3. Start here and follow the links. The left sidebar shows all folders.

## Map of the vault

### Start here
- [[01 Project Brief]] — what we're building and the three MUSTs
- [[Install Prerequisites]] → [[Run the App Locally]] — get it running in ~10 minutes
- [[Glossary]] — every technical word used here, explained

### Rebuild it from zero (step by step)
- [[Step 01 - Create the repo and workspaces]]
- [[Step 02 - Server skeleton]]
- [[Step 03 - Database]]
- [[Step 04 - Accounts, sessions and email codes]]
- [[Step 05 - KYC verification]]
- [[Step 06 - Requests (listings)]]
- [[Step 07 - Listing-bound messaging]]
- [[Step 08 - Admin and moderation]]
- [[Step 09 - Automated API tests]]
- [[Step 10 - Client setup]]
- [[Step 11 - Client pages]]
- [[Step 12 - End-to-end check]]
- [[Step 13 - Real email sending]]
- [[Step 14 - Password reset]]
- [[Step 15 - Performance and hardening]]

### How it works
- [[Architecture Overview]] · [[Folder Map]] · [[Database Schema]] · [[API Reference]]
- Features: [[KYC Verification]] · [[Listing-Bound Messaging]] · [[Email Verification]] · [[Email Sending]] · [[Password Reset]] · [[Admin and Moderation]] · [[Design System]]

### Why it is built this way
- [[Decisions Index]] — every decision record (ADR) with the options we compared

### What went wrong and how we fixed it
- [[Mistakes and Fixes]] — the running log (read this before changing things!)

### History
- [[Sessions Index]] — one note per working session / chat
- [[Roadmap]] — what's next

### Going live
- [[Environment Variables]] · [[Deploying to Production]]

## Status (2026-10-21, after session 05)
| Area | State |
|---|---|
| Accounts + email verification | ✅ done |
| KYC (manual review, pluggable providers) | ✅ done |
| Requests: post / browse / search / edit / close | ✅ done |
| Listing-bound private messaging | ✅ done |
| Admin: KYC queue, reports, bans | ✅ done |
| Password reset + change password | ✅ done |
| Real email (SMTP or Resend) | ✅ done — needs your provider details in `.env` |
| Performance (indexes, gzip, caching, lazy pages) | ✅ done — see [[ADR-013 Performance]] |
| Code review: 15 bugs | ✅ all fixed, each with a test |
| API tests | ✅ 51 passing |
| Browser end-to-end test | ✅ passing |
| Automated KYC provider (Stripe Identity etc.) | ⏳ interface ready — see [[KYC Verification]] |
