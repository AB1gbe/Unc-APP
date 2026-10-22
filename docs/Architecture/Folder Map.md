---
tags: [architecture, reference]
---
# Folder Map — WHERE everything lives

```
Unc-APP/
├── package.json            Root: npm workspaces + scripts (dev, build, start, test, seed, e2e)
├── package-lock.json       Exact versions of every package (commit it!)
├── .env.example            Copy to .env for local settings (email, admin…); .env is git-ignored
├── CLAUDE.md               Instructions for AI sessions (always document in docs/)
├── README.md               Short intro + quick start
├── docs/                   ← THIS Obsidian vault
├── pull.cmd / push.cmd    Type `pull` / `push` in Command Prompt (session 10)
├── .gitattributes        Keeps .cmd files with Windows line endings
├── scripts/git-helper.mjs  The pull/push logic (session 10)
├── scripts/live-sync.mjs  `npm run live` / `npm run sync`: auto-pull pushed changes (session 09)
├── e2e/arabic.mjs        `npm run e2e:ar`: Arabic journey + RTL/overflow/English-leak checks (session 12); skips member text in <bdi> / dir="auto" (session 20)
├── e2e/devices.mjs       `npm run e2e:devices`: 5 screen sizes × English/Arabic — no sideways scroll, touch targets ≥ 40 px (session 13)
├── scripts/make-icons.mjs  Draws the app icons into client/public/icons/ (`node scripts/make-icons.mjs`, session 13)
├── e2e/smoke.mjs           Playwright browser test (screenshots → e2e/screenshots/, git-ignored)
├── shared/                 Plain JS used by BOTH server and client (session 31)
│   ├── package.json        `{type: module}` only — not a workspace, nothing to install
│   ├── areas.js            Bahrain governorates + areas (English/Arabic/other spellings): normalizeCity(),
│                             governorateOf(), governorateNamed(), areasOf(), placeName()
│   └── names.js            "Show only my first name": shortName() ("Sam Buyer" → "Sam B."), nameFor() (session 34)
├── server/
│   ├── package.json        Server deps + scripts
│   ├── data/               (created at runtime, git-ignored) database + uploads/
│   │                         uploads/listings (public), uploads/avatars (public, session 13),
│   │                         uploads/stories (public, session 20), uploads/covers (public shop covers, session 24),
│   │                         uploads/kyc (PRIVATE), uploads/chat (PRIVATE, session 13)
│   ├── src/
│   │   ├── index.js        Starts the server (opens DB, ensures admin, listen); hourly cleanupExpired() + runExpiry() (session 31) + runDeletions() (session 37)
│   │   ├── app.js          Builds the Express app: security headers, routes, static files, pages with link previews (session 20)
│   │   ├── config.js       All settings from environment variables
│   │   ├── db.js           SQLite connection, MIGRATIONS list (28 since session 37), tx() and audit() helpers
│   │   ├── seed.js         ensureAdmin() + demo data (npm run seed)
│   │   ├── mail-test.js    Sends one test email (npm run mail:test -- you@example.com)
│   │   ├── lib/
│   │   │   ├── crypto.js       scrypt passwords, tokens, sha256, peppered HMAC, 6-digit codes
│   │   │   ├── http.js         HttpError + JSON error handler
│   │   │   ├── validate.js     Input validators (str, int, email, isoDate, password, ageOn…)
│   │   │   ├── uploads.js      Multer in-memory uploads, magic-byte sniffing, saveFiles() (all-or-nothing),
│   │   │   │                     KYC_DIR / LISTING_DIR / AVATAR_DIR / CHAT_DIR / STORY_DIR, avatarUrl()
│   │   │   ├── mailer.js       sendMail()/trySendMail(): console | memory | smtp (nodemailer) | resend
│   │   │   ├── emails.js       Text + HTML of every email, English + Arabic (session 12)
│   │   │   ├── i18n.js         Server messages in Arabic, readable field names (session 12)
│   │   │   ├── categories.js   CATEGORIES + CURRENCIES lists
│   │   │   ├── ratings.js      Rating rules: windows, blind visibility, summaries (session 09)
│   │   │   ├── notify.js       notify(): writes a 🔔 notification (offer, deal, rating, kyc_*, favourite-request, alert-match, expiring, expired, found-elsewhere, request-closed, report-action, report-no-action, budget-raised) (session 13, kinds added in 28, 31, 34 and 37);
│   │   │   │                     thankOtherSellers(): thank-you to the sellers not picked when a request closes (session 34)
│   │   │   ├── contact-guard.js hasContactDetails(): no phones/links/emails/@handles in public text (session 24)
│   │   │   ├── shop-hours.js   readShopHours(): validates opening hours (session 24)
│   │   │   ├── push.js         pushTo(): phone notifications via Web Push; VAPID keys (session 15)
│   │   │   ├── activity.js     "Active now" (last_seen_at) + usual reply time (session 20); away mode: setAway(), NOT_AWAY, MAX_AWAY_DAYS (session 37)
│   │   │   ├── badges.js       Earned badges: fast, top-finder, trusted, new (session 20)
│   │   │   ├── blocks.js       blockedBetween(), NOT_BLOCKED_BUYER (session 31)
│   │   │   ├── expiry.js       runExpiry(): "Still looking?" reminder at day 27, closes at day 30 (session 31); then thanks the other sellers (session 34)
│   │   │   ├── contact.js      "Who can make offers": CONTACT_RULES, contactBlocker(), isWellRated(), CONTACT_ALLOWED_SQL (session 34)
│   │   │   ├── offers.js       Offer details: readOfferDetails(), offerDetailsView(), isExpired() (session 34)
│   │   │   ├── deletion.js     "Download my data" + "Delete my account": exportData(), runDeletions() (hourly), deleteNow(),
│   │   │   │                     DELETE_AFTER_DAYS = 7, "Deleted member" (session 37)
│   │   │   ├── metrics.js      Owner dashboard numbers: metrics(db, days), METRIC_DAYS = 7/30/90 (session 37)
│   │   │   └── previews.js     Open Graph link-preview tags written into index.html (session 20)
│   │   ├── middleware/auth.js  loadUser (also updates last_seen_at, at most once a minute — session 20), requireAuth, requireVerified, requireAdmin, publicMe
│   │   ├── kyc/
│   │   │   ├── index.js        getProvider(), applyDecision()
│   │   │   └── providers/      manual.js (+ README on adding Stripe/Persona…)
│   │   └── routes/
│   │       ├── auth.js          /api/auth/* (incl. forgot/reset/change password, profile, avatar, onboarded; me/export, me/delete, away mode — session 37)
│   │       ├── kyc.js           /api/kyc (submit + status), sendKycFile(); refuses IDs in banned_id_hashes (session 37)
│   │       ├── listings.js      /api/listings/* (incl. for-you, saved, photos, renew — session 31; raise the budget — session 37)
│   │       ├── conversations.js /api/listings/:id/contact, /api/conversations/* (incl. private chat photos, accept/decline a price, compare offers — session 31;
│   │       │                      proof photos + proofCode, offer details — session 34), /api/reports
│   │       ├── ratings.js       /api/deals/:id/rating, /api/members/:id (session 09), /api/deals/:id/problem "Something went wrong" (session 34)
│   │       ├── notifications.js /api/notifications/* (session 13)
│   │       ├── push.js          /api/push/* turn phone notifications on/off, test (session 15)
│   │       ├── stories.js       /api/stories, /api/deals/:id/story, /api/admin/stories/:id/hide (session 20)
│   │       ├── feed.js          /api/feed: "Happening near you" (session 26)
│   │       ├── favourites.js    /api/members/:id/favourite, /api/favourites, tellFavourites() (session 28)
│   │       ├── alerts.js        /api/alerts, alertMatches(), tellAlerts() (session 31)
│   │       ├── demand.js        /api/demand: "What people are asking for", topWords() (session 34)
│   │       ├── blocks.js        /api/members/:id/block, /api/blocks (session 31)
│   │       └── admin.js         /api/admin/* (metrics for the owner dashboard, report outcome — session 37)
│   └── test/
│       ├── helpers.js          In-memory app + user factory (any verification stage)
│       ├── kyc.test.js
│       ├── messaging.test.js
│       ├── password.test.js
│       ├── mail-transports.test.js
│       ├── performance.test.js     (session 05)
│       ├── review-fixes.test.js    (session 05: one test per bug M24–M35)
│       ├── ratings.test.js         (session 09)
│       ├── i18n-coverage.test.js   every UI text has Arabic (session 12)
│       ├── arabic.test.js          Arabic errors, language, emails (session 12)
│       ├── profiles.test.js        profile, avatar, welcome step, public profile (session 13)
│       ├── home.test.js            /api/listings/for-you (session 13)
│       ├── photos.test.js          request photos + private chat photos (session 13)
│       ├── saved.test.js           saved requests (session 13)
│       ├── notifications.test.js   🔔 notifications (session 13)
│       ├── push.test.js            phone push for new offers, fake push service (session 15)
│       ├── offer-email.test.js     new-offer email, Arabic, on/off switch, text direction (session 17)
│       ├── offer-responses.test.js accept / decline a price, buyer counter-offers (session 20)
│       ├── activity.test.js        "Active now", reply time, "Seen by N people" (session 20)
│       ├── previews.test.js        link-preview tags on request pages (session 20)
│       ├── stories-badges.test.js  "Found it" stories + earned badges (session 20)
│       ├── seasons.test.js         home greeting + seasonal line (client/src/seasons.js) (session 20)
│       ├── shop.test.js            shop pages, contact-details guard, "open now" (client/src/hours.js) (session 24)
│       ├── feed.test.js            "Happening near you": anonymity, city first, exclusions (session 26)
│       ├── favourites.test.js      favourite sellers + the heads-up on new requests (session 28)
│       ├── compare-offers.test.js  "Compare offers" data, buyer only (session 31)
│       ├── alerts.test.js          request alerts: limits, matching, one notification per request (session 31)
│       ├── areas.test.js           Bahrain areas: spellings, governorate search, feed "near" (session 31)
│       ├── blocks-scam.test.js     blocking + scam warnings (client/src/scam.js) (session 31)
│       ├── expiry-tips.test.js     "Still looking?" expiry, renew, tips (client/src/tips.js) (session 31)
│       ├── privacy-contact.test.js "Show only my first name" + "who can make offers" (session 34)
│       ├── demand.test.js          "What people are asking for": counts, words, area (session 34)
│       ├── proof-photo.test.js     proof photos: code, ask, seller-only (session 34)
│       ├── offer-details.test.js   condition, warranty, returns, "valid until" (session 34)
│       ├── closing-problems.test.js thank-you to other sellers + "Something went wrong" after a deal (session 34)
│       ├── account-deletion.test.js "Download my data" + "Delete my account": 7-day wait, cancel, wipe, banned IDs (session 37)
│       ├── metrics.test.js         owner dashboard numbers, admins only (session 37)
│       ├── away-mode.test.js       away mode: no heads-ups, "away until", reply time (session 37)
│       ├── pickup.test.js          pickup checklist + big-deal limits (client/src/pickup.js) (session 37)
│       └── report-budget.test.js   report follow-up 🔔 + "Raise my budget" (session 37)
└── client/
    ├── package.json
    ├── index.html          The single HTML page React mounts into (+ manifest, theme colour, iPhone icon)
    ├── public/
    │   ├── manifest.webmanifest  "Add to Home Screen" (PWA) name, colours, icons (session 13)
    │   ├── sw.js           Service worker: shows push notifications, opens the conversation on tap (session 15)
    │   └── icons/          icon-192, icon-512, icon-512-maskable, apple-touch-icon (made by scripts/make-icons.mjs)
    ├── vite.config.js      Dev server :5173 + proxy to :4000
    └── src/
        ├── main.jsx        Mounts <App/> with Router + AuthProvider
        ├── App.jsx         All page routes + guards (`/` = Home for members, Browse for visitors)
        ├── api.js          api() fetch wrapper, money/budget/date helpers
        ├── auth.jsx        AuthProvider, useAuth(), isVerified()
        ├── i18n.jsx        t(), tj(), tn(), LanguageProvider, date helpers (session 12)
        ├── locales/ar.js   All Arabic text, keyed by the English
        ├── kycReasons.js   English-stored values (reasons, statuses) shown translated
        ├── push.js         pushSupport(), enablePush(), disablePush() for this device (session 15)
        ├── images.js       shrinkImage(): resizes photos in the browser before upload (session 13)
        ├── seasons.js      partOfDay(), season(), hijri(): home greeting + seasonal line (session 20)
        ├── hours.js        openState(): "Open now" from a shop's hours, incl. past midnight (session 24)
        ├── scam.js         Scam warnings on the other person's chat messages (session 31)
        ├── tips.js         Tips to get more offers on a quiet request (session 31)
        ├── pickup.js       Pickup checklist per category: checklistFor(), isBigDeal(), BIG_DEAL limits per currency (session 37)
        ├── hooks.js        useApi(path), useMeta(), usePolling(fn, ms, enabled)
        ├── styles.css      The whole design system
        ├── components/
        │   ├── Layout.jsx  Top bar + unread badges (messages, 🔔) + page outlet; "account will be deleted" banner (session 37)
        │   ├── TabBar.jsx  Bottom tab bar on phones/tablets (under 900 px, members only) (session 13)
        │   ├── PushSettings.jsx   "Notifications on this phone" card: turn on, test, turn off (session 15)
        │   ├── ProfileEditor.jsx  Photo, name, city, bio, interests — Account page + Welcome (session 13)
        │   ├── ShopEditor.jsx     "Your shop page": cover, area, opening hours (business accounts, session 24)
        │   ├── ShopHours.jsx      Opening-hours card, OpenNow, dayName() (session 24)
        │   ├── Feed.jsx           "Happening near you" card: Home and the landing page (session 26)
        │   ├── FavouriteButton.jsx ♡ Favourite a seller: profile + deal box (session 28)
        │   ├── CompareOffers.jsx  "Compare offers" side by side on the buyer's request page (session 31); details + "✓ Proof photo" (session 34); "🌴 Away until" (session 37)
        │   ├── OfferDetails.jsx   Offer details: OfferDetailFields (seller picks), OfferDetailsLine (shown with the price), addDetails() (session 34)
        │   ├── CityField.jsx      CityField (city input with Bahrain areas suggested) + Place (area name in the reader's language) (session 31)
        │   ├── PhotoPicker.jsx    Choose photos with previews, shrinks them first (session 13)
        │   ├── Lightbox.jsx       Full-screen photo viewer: swipe, arrow keys, Esc (session 13)
        │   ├── Celebrate.jsx      celebrate(): toast + confetti; <Celebrations/> sits in Layout (session 20)
        │   ├── ShareButton.jsx    "↗ Share" a request: phone share sheet, or WhatsApp / Copy link (session 20)
        │   ├── Stories.jsx        StoryCard, StoriesStrip, StoryForm — "Found it" stories (session 20)
        │   ├── PickupCard.jsx     Pickup checklist + "🛡️ Big deal" safety card in a chat after a price is accepted; ticks saved on this device only (session 37)
        │   ├── DeletePending.jsx  "Your account will be deleted on …" + "Keep my account": Account page and top of every page (session 37)
        │   └── ui.jsx      ErrorBox, Loading (skeleton) + CardsLoading, badges, Avatar (photo or first letter), ListingCard, VerifyPrompt, route guards, Activity, Badges (session 20), ContactRule ("🔒 Shops only" badge, session 34); Activity shows "🌴 Away until …" (session 37)
        └── pages/
            ├── Browse.jsx          Visitors' home + /browse: hero, search, request grid, paging
            ├── Home.jsx            Members' home: needs attention, my requests, saved, requests for you (session 13); "📊 What people ask for" link to /demand (session 34)
            ├── Welcome.jsx         Welcome step after email confirm: photo, bio, interests (session 13)
            ├── Saved.jsx           Saved requests (session 13)
            ├── Notifications.jsx   The 🔔 page; wording per `kind` (session 13; found-elsewhere, request-closed in session 34; report-action, report-no-action, budget-raised in session 37)
            ├── Alerts.jsx          /alerts: request alerts for sellers (session 31)
            ├── Demand.jsx          /demand: "What people are asking for", for sellers (session 34)
            ├── ListingDetail.jsx   Request page: OfferPanel (vendor) / OwnerPanel (buyer), ReportLink; offer details, "who can make offers" note (session 34); RaiseBudget "Raise my budget" in OwnerPanel (session 37)
            ├── NewListing.jsx      Post + edit a request; "Who can make offers?" (session 34)
            ├── MyListings.jsx
            ├── Inbox.jsx           Conversations grouped by request, tabs received/sent
            ├── Conversation.jsx    Chat with polling + photos; OfferCard, AnswerLine, QuickReplies, StoryForm in the deal banner (session 20);
            │                         proof photos (ProofAskButton, ProofAskLine), DealProblem "Something went wrong" (session 34); PickupCard (session 37)
            ├── Login.jsx  Register.jsx  VerifyEmail.jsx (+ Steps bar)  Verification.jsx (KYC)
            ├── ForgotPassword.jsx  ResetPassword.jsx
            ├── Account.jsx (profile + change password; blocked members list, session 31; "Show only my first name", session 34; AwayMode + YourData "Download my data" / "Delete my account", session 37)  NotFound.jsx
            ├── MemberProfile.jsx   Public profile + reviews (session 09); photo, bio, interests, open requests (session 13)
            ├── admin/AdminHome.jsx (stats, KYC queue, reports; deal problems with their kind, session 34; "✓ Took action" / "Nothing wrong", session 37)  admin/KycReview.jsx
            └── admin/Dashboard.jsx  Owner dashboard "How the marketplace is doing" (7/30/90 days, charts + table), shown on AdminHome (session 37)
```
