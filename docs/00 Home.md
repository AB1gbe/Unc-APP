---
tags: [home, index]
updated: 2026-10-22 (session 40)
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
- Idea lists: [[Social Marketplace Ideas]] · [[More Ideas for the Vision]] · [[Fresh Ideas for the Vision]] · [[New Directions for the Vision]] · [[Keeping Deals on Unc]] · [[Publishing as an App]]
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
- [[Step 31 - Happening near you]]
- [[Step 32 - Favourite sellers]]
- [[Step 33 - Compare offers]]
- [[Step 34 - Request alerts]]
- [[Step 35 - Bahrain areas]]
- [[Step 36 - Block and scam warnings]]
- [[Step 37 - Expiry and tips]]
- [[Step 38 - Who may contact me and first name only]]
- [[Step 39 - Unmet demand board]]
- [[Step 40 - Proof photos]]
- [[Step 41 - Offer details]]
- [[Step 42 - Closing note and deal problems]]
- [[Step 43 - Download and delete my data]]
- [[Step 44 - Owner dashboard]]
- [[Step 45 - Away mode]]
- [[Step 46 - Pickup checklist and big-deal card]]
- [[Step 47 - Report follow-up and raise my budget]]
- [[Step 48 - Hide contact details until a price is agreed]]
- [[Step 49 - Did you get it]]
- [[Step 50 - Terms of use]]
- [[Step 51 - Payment card when joining]]
- [[Step 52 - Paying in parts]]

### How it works
- [[Architecture Overview]] · [[Folder Map]] · [[Database Schema]] · [[API Reference]]
- Features: [[KYC Verification]] · [[Listing-Bound Messaging]] · [[Email Verification]] · [[Email Sending]] · [[Password Reset]] · [[Ratings]] · [[Arabic and RTL]] · [[Profiles and Onboarding]] · [[Phones and Devices]] · [[Photos]] · [[Saved Requests and Notifications]] · [[Push Notifications]] · [[Social Touches]] · [[Shop Pages]] · [[Choosing, Alerts and Safety]] · [[Privacy, Demand and Trust]] · [[Your Data, Dashboard and Care]] · [[Deals, Terms, Cards and Installments]] · [[Admin and Moderation]] · [[Design System]]

### Why it is built this way
- [[Decisions Index]] — every decision record (ADR) with the options we compared

### What went wrong and how we fixed it
- [[Mistakes and Fixes]] — the running log (read this before changing things!)

### History
- [[Sessions Index]] — one note per working session / chat
- [[Roadmap]] — what's next

### Going live
- [[Environment Variables]] · [[Deploying to Production]]

## Status (2026-10-22, after session 40)
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
| Shop pages for business accounts (cover, area, opening hours, no contact details) | ✅ done — in `main` since session 25 → [[Shop Pages]] |
| "Happening near you" feed | ✅ done — in `main` since session 27 → [[Social Touches]] |
| Favourite sellers (heads-up on new requests) | ✅ done — in `main` since session 29 → [[Social Touches]] |
| Compare offers, request alerts, Bahrain areas, block + scam warnings, expiry + tips | ✅ done — on branch (session 31) → [[Choosing, Alerts and Safety]] |
| Who may contact me + first name only, unmet demand board, proof photos, offer details, closing note + deal problems | ✅ done — on branch (session 34) → [[Privacy, Demand and Trust]] |
| Download/delete my data, owner dashboard, away mode, pickup checklist + big-deal card, report follow-up + raise my budget | ✅ done — on branch (session 37) → [[Your Data, Dashboard and Care]] |
| Hidden numbers until a price is agreed, "Did you get it?", Terms (draft), card when joining (showcase), paying in parts | ✅ done — on branch (session 40) → [[Deals, Terms, Cards and Installments]] |
| API tests | ✅ 170 passing |
| Browser tests: English journey, Arabic journey, all devices | ✅ passing (`npm run e2e`, `e2e:ar`, `e2e:devices`) |
| Automated KYC provider (Stripe Identity etc.) | ⏳ interface ready — see [[KYC Verification]] |
