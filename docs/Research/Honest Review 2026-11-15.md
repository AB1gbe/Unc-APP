---
tags: [research, review]
date: 2026-11-15
---
# Honest review (2026-11-15)

The owner asked: "Give me your no-bullshit feedback: what should be improved." Ranked by how much each matters.

## 1. Pick one identity and stop pivoting
In about two weeks Unc went from a reverse marketplace ("buyers post what they want") → Siin-style → Craigslist → Facebook Marketplace. Each pivot was built well, but the result is a generic classifieds app, and the one original idea, **Wanted** (verified shops compete for your request), is now the fourth tab. Facebook Marketplace already wins "photo grid of things for sale" in Bahrain. Unc needs a reason to exist that Marketplace doesn't cover: **verified shops answering requests**, and **safe housing/jobs without scams**.

## 2. Signing up is far too hard for a marketplace with no users
To post anything, or even reply, a person needs:
- a confirmed email;
- an ID check with document photos and a selfie, waiting for an admin;
- a payment card;
- accepted Terms.

Craigslist and Facebook ask for none of this. Most people will leave at the ID step.
- **Fix:** browsing and replying with only a confirmed email or phone number (Bahrain numbers, SMS code).
- The ID check only for businesses, housing and jobs posters, and above a price limit.
- No card for people at all; only businesses, when they pay.

## 3. No users yet: the real problem is the empty marketplace
Everything on the site is demo data. A marketplace lives or dies by having enough ads in one place. Don't launch "all of Bahrain, all categories":
- start with **one area** (e.g. Manama/Juffair) and **one or two categories** (phones and electronics, or flats and rooms);
- bring 20–30 real shops on board by hand, free.

Charging businesses before there are buyers will stop them joining: **make everything free for the first months**, keep the billing code switched off.

## 4. Too many features for zero users
Built and live:
- installments, wallet credit, referral rewards, "found it" stories, proof photos, pickup checklist;
- demand page, request alerts, away mode, budget raising, compare offers;
- business teams and more.

That's 38 routes. Each one is more to explain, test and maintain, and makes the app feel busy. Hide everything that isn't: post, browse, chat, rate, report. Bring things back when real users ask.

## 5. The design is inconsistent between pages
The home page, For sale and Housing got the new marketplace look. The Wanted page, request pages, My Unc, Messages, Settings and the Business panel still use older styles. That's why the app "looks unfinished" even when one screen looks good. It needs one pass over every page with the same components, ideally with a real designer and a small design system (it changed ~10 times by feedback on screenshots).

## 6. Photos will make it slow (corrected in session 102)
**Correction:** the browser already shrank photos to about 1600px before upload ([[Mistakes and Fixes#M158]]). What was really missing: thumbnails for grids and shrinking ID-check photos. Both done in [[2026-11-15 Session 102]].

Uploaded photos are saved at full size and never resized. A phone photo is often 3–5 MB; a grid of 12 would be 40+ MB on mobile data. Needed: resize to about 1200px and make small thumbnails (about 400px) on upload, served for grids.

## 7. "Safety" is a promise the code only partly keeps
- The scam check is a list of words; scammers change one word.
- ID checks are done by hand by one admin.
- Fine for a test; before launch: report-based hiding, limits for new accounts, a real ID-check provider, and someone reviewing reports daily.

## 8. Not ready for real users (known)
- Email is in test mode (codes shown on screen).
- Payments are in test mode.
- The Terms are a draft that needs a Bahraini lawyer.
- ID photos are stored on Cloudflare outside Bahrain (PDPL).
- Everything runs in one Cloudflare Durable Object; there are no backups.

## What to do next (suggested order)
1. Decide the identity (one sentence) and the first area and category.
2. Make sign-up light (point 2) and everything free.
3. Hide the extra features.
4. Resize photos.
5. One consistent design pass over every page.
6. Then real email, a lawyer for the Terms, backups, and only then payments.
