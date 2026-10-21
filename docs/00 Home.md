---
tags: [home, index]
updated: 2026-10-21 (session 24)
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
- [[Watch Changes Live]] — watch the app update while Claude builds (optional)
- [[Pull and Push]] — type `pull` or `push` instead of git commands

### Market
- [[Bahrain Market Research]] — similar apps in Bahrain, gaps, what Unc would need
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
- [[Step 16 - Ratings]]
- [[Step 17 - Arabic and RTL]]
- [[Step 18 - Profiles, welcome and home]]
- [[Step 19 - Phones, tablets and app icons]]
- [[Step 20 - Photos everywhere]]
- [[Step 21 - Saved requests and notifications]]
- [[Step 22 - Push notifications]]
- [[Step 23 - Email for new offers]]
- [[Step 24 - Warm wording and celebrations]]
- [[Step 25 - Offer cards and quick replies]]
- [[Step 26 - Activity and views]]
- [[Step 27 - Share and link previews]]
- [[Step 28 - Stories and badges]]
- [[Step 29 - Hide my activity]]
- [[Step 30 - Shop pages]]

### How it works
- [[Architecture Overview]] · [[Folder Map]] · [[Database Schema]] · [[API Reference]]
- Features: [[KYC Verification]] · [[Listing-Bound Messaging]] · [[Email Verification]] · [[Email Sending]] · [[Password Reset]] · [[Ratings]] · [[Arabic and RTL]] · [[Profiles and Onboarding]] · [[Phones and Devices]] · [[Photos]] · [[Saved Requests and Notifications]] · [[Push Notifications]] · [[Social Touches]] · [[Shop Pages]] · [[Admin and Moderation]] · [[Design System]]

### Why it is built this way
- [[Decisions Index]] — every decision record (ADR) with the options we compared

### What went wrong and how we fixed it
- [[Mistakes and Fixes]] — the running log (read this before changing things!)

### History
- [[Sessions Index]] — one note per working session / chat
- [[Roadmap]] — what's next

### Going live
- [[Environment Variables]] · [[Deploying to Production]]

## Status (2026-10-21, after session 24)
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
| Ratings after a deal (blind, two-way) + member profiles | ✅ done — in `main` since session 11 |
| Live preview while building (`npm run live`) | ✅ done |
| One-word `pull` / `push` | ✅ done |
| Arabic + right-to-left (pages, server messages, emails) | ✅ done — in `main` since session 14 |
| Profiles (photo, bio, interests), welcome step, member home | ✅ done — in `main` since session 14 |
| Photos: request (6), offer, private chat photos, full-screen viewer | ✅ done — in `main` since session 14 |
| Phones, tablets, every screen size; installable (Add to Home Screen) | ✅ done — in `main` since session 14 |
| Saved requests (♡) and notifications (🔔) | ✅ done — in `main` since session 14 |
| Email to the buyer for every new offer (switch in Account) | ✅ done — in `main` since session 18 |
| Push notifications to the phone for new offers | ✅ done — in `main` since session 16; real-phone test still to do → [[Push Notifications]] |
| Feels human: greetings and celebrations, offer cards, "Active now", share with previews, stories and badges | ✅ done — in `main` since session 21 → [[Social Touches]] |
| "Hide when I'm online" privacy setting | ✅ done — in `main` since session 23 |
| Shop pages for business accounts (cover, area, opening hours, no contact details) | ✅ done — on branch (session 24) → [[Shop Pages]] |
| API tests | ✅ 119 passing |
| Browser tests: English journey, Arabic journey, all devices | ✅ passing (`npm run e2e`, `e2e:ar`, `e2e:devices`) |
| Automated KYC provider (Stripe Identity etc.) | ⏳ interface ready — see [[KYC Verification]] |
