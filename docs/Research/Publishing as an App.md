---
tags: [research, launch, mobile]
date: 2026-10-25
---
# Publishing Unc as an app (Google Play and the App Store)

**The question:** "Now I want to upload it as an app. What will that require?"

## Where Unc is today (checked in the code)
- Unc is a **web app that can already be installed** on a phone (a "PWA"): it has `client/public/manifest.webmanifest` ("Unc", standalone, icons 192/512/maskable/apple-touch) and a service worker `client/public/sw.js` with phone push. On Android Chrome and on iPhone (Share → **Add to Home Screen**) it opens full-screen like an app, and push works on iPhone from iOS 16.4.
- It only runs **on your PC** so far. Nothing is on the internet yet.
- Unc already has several things the stores insist on for apps with chats and members: report, block, **in-app account deletion** (session 37), Terms (draft, session 40) and identity checks.
- Missing for the stores: a **privacy policy** page, a public **"how to delete your account"** page, and store listing material.

## The big point: the app needs a live server first
A store app is only a shell around Unc's website and server. **Before any store, Unc must be online**, with a real address (e.g. `unc.bh`). This is in [[Deploying to Production]]:
| Must have | Why | Cost (rough) |
|---|---|---|
| Hosting for the server + a disk for the database and photos (Render, Railway, a VPS…) | The app talks to it | ~$7–25 / month to start |
| A domain name (e.g. `.bh` or `.com`) with HTTPS | Stores and push need https | ~$10–40 / year |
| Real email (Resend/SMTP) with your domain | Sign-up codes, password reset | free–$20 / month |
| Backups of the data folder | ID documents and chats can't be lost | small |
| Production settings (`SECRET_PEPPER`, admin password, `APP_URL`, `TRUST_PROXY=1`) | Security | — |
| ⚖️ Where the data lives | ID documents are sensitive; Bahrain's PDPL limits sending them abroad. Ask the lawyer whether hosting outside Bahrain is OK (see [[Bahrain Market Research]]) | — |

## Three ways to "be an app"
| Way | What it is | Needs | Effort | Store? |
|---|---|---|---|---|
| **1. Install from the website (PWA)** | People open the site and tap "Add to Home Screen" / "Install" | Only the live website | Already built | ❌ No store page |
| **2. Google Play (wrapped PWA, "TWA")** | A small Android package that opens Unc's website full-screen, made with **PWABuilder** (free, from the web address) or Bubblewrap | Google Play developer account (**$25 once**), a file on the website that proves you own it (`/.well-known/assetlinks.json`), the store listing | Low | ✅ Play Store |
| **3. Apple App Store (Capacitor)** | The same web app inside an iPhone app shell, with native push | Apple Developer Program (**$99 / year**), **a Mac** (or a paid cloud Mac build service such as Codemagic), more review work | Medium–high | ✅ App Store |

## What each store will ask for
**Both stores:**
- a **privacy policy** at a public web address (missing; must also cover identity checks and cards);
- a way to **delete the account** (✅ in the app) and a **web page** explaining how;
- app name, icon (✅ 512 px exists), short and long description, **screenshots** (phone and tablet), a support email, and a content rating questionnaire;
- a **test login** for the reviewers (a verified demo buyer and shop);
- for chats between members: reporting, blocking and Terms (✅ built);
- for organisation accounts: your **CR / company details** and a **D-U-N-S number** (free from Dun & Bradstreet; takes days to weeks). A personal account is also possible, but then your name shows as the seller.

**Google Play specifically:**
- the **Data safety** form (what data: ID photos, selfie, email, location area, card token, chats);
- **new personal developer accounts** must first run a **closed test with about 12 testers for 14 days** before going public. Organisation accounts don't. These rules change; check the current Play Console rules when you sign up.

**Apple specifically:**
- **App Privacy "labels"** (same data list).
- Apple rejects apps that are "just a website" (guideline 4.2). Unc should feel like an app: native push notifications, camera for ID and photos, no browser bars. Capacitor adds these.
- Physical goods and services paid between people **don't** need Apple's in-app purchase. Cards through Tap are fine.
- ID/selfie checks: explain why in the review notes.

## Free testing first
To try it on a phone without paying anything: [[Step 53 - Test as an app on your phone for free]] (a free Cloudflare tunnel, and a test Android `.apk` from PWABuilder).

## "Can't it go on the Play Store for free?" (session 45)
No. Anything on the Play Store, even a private test, needs:
1. **A Google Play developer account: $25, paid once** (no yearly fee). There is no free way around it. Even "internal testing", where only the people you invite can install it from the Play Store, needs this account.
2. **A fixed https address.** The Play Store app opens one address forever, so the free tunnel (a new address every time) doesn't fit. Free option: a free hosting tier gives a fixed address like `unc.onrender.com` (it sleeps when unused, and its data resets on restart, which is fine for testing).

Cheapest real Play Store test: **$25 once** + free hosting → PWABuilder package → Play Console **Internal testing** (up to 100 testers you invite by email, quick review). Before a public release, a new *personal* account must also run a closed test (about 12 testers for 14 days).

## Recommended order
1. **Go live on the web** (hosting, domain, email, backups, production settings) + a **privacy policy** + a lawyer's look at Terms and privacy. Members on iPhone and Android can already install it from the website.
2. **Google Play** with PWABuilder: cheapest and fastest; the same website keeps updating the app without new store releases.
3. **App Store** with Capacitor (needs a Mac or a cloud build, and more review work), once Play shows people use it.

## What Claude can build now (no accounts needed)
- A **privacy policy** page (draft for the lawyer, English + Arabic) and a public **"Delete your account"** help page.
- Serve `/.well-known/assetlinks.json` from a setting (for Google Play), and store-ready screenshots from the browser tests.
- A **Capacitor** project folder (`mobile/`) ready for a Mac or cloud build, with native push wired to the existing notifications.
- A step-by-step guide in the Build Guide for PWABuilder → Play Console, and for Capacitor → Xcode → App Store Connect.

## What only the owner can do (⚖️)
- Pay for and open: hosting, domain, Google Play account, Apple developer account (and get a D-U-N-S number for a company account).
- Choose personal or company developer accounts (company = your CR).
- Lawyer: Terms, privacy policy, where ID data may be stored (PDPL).
- Provide a Mac or choose a cloud build service for iPhone.
