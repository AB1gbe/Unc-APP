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
├── server/
│   ├── package.json        Server deps + scripts
│   ├── data/               (created at runtime, git-ignored) database + uploads/
│   │                         uploads/listings (public), uploads/avatars (public, session 13),
│   │                         uploads/stories (public, session 20),
│   │                         uploads/kyc (PRIVATE), uploads/chat (PRIVATE, session 13)
│   ├── src/
│   │   ├── index.js        Starts the server (opens DB, ensures admin, listen)
│   │   ├── app.js          Builds the Express app: security headers, routes, static files, pages with link previews (session 20)
│   │   ├── config.js       All settings from environment variables
│   │   ├── db.js           SQLite connection, MIGRATIONS list, tx() and audit() helpers
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
│   │   │   ├── notify.js       notify(): writes a 🔔 notification (offer, deal, rating, kyc_*) (session 13)
│   │   │   ├── push.js         pushTo(): phone notifications via Web Push; VAPID keys (session 15)
│   │   │   ├── activity.js     "Active now" (last_seen_at) + usual reply time (session 20)
│   │   │   ├── badges.js       Earned badges: fast, top-finder, trusted, new (session 20)
│   │   │   └── previews.js     Open Graph link-preview tags written into index.html (session 20)
│   │   ├── middleware/auth.js  loadUser (also updates last_seen_at, at most once a minute — session 20), requireAuth, requireVerified, requireAdmin, publicMe
│   │   ├── kyc/
│   │   │   ├── index.js        getProvider(), applyDecision()
│   │   │   └── providers/      manual.js (+ README on adding Stripe/Persona…)
│   │   └── routes/
│   │       ├── auth.js          /api/auth/* (incl. forgot/reset/change password, profile, avatar, onboarded)
│   │       ├── kyc.js           /api/kyc (submit + status), sendKycFile()
│   │       ├── listings.js      /api/listings/* (incl. for-you, saved, photos)
│   │       ├── conversations.js /api/listings/:id/contact, /api/conversations/* (incl. private chat photos, accept/decline a price), /api/reports
│   │       ├── ratings.js       /api/deals/:id/rating, /api/members/:id (session 09)
│   │       ├── notifications.js /api/notifications/* (session 13)
│   │       ├── push.js          /api/push/* turn phone notifications on/off, test (session 15)
│   │       ├── stories.js       /api/stories, /api/deals/:id/story, /api/admin/stories/:id/hide (session 20)
│   │       └── admin.js         /api/admin/*
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
│       └── seasons.test.js         home greeting + seasonal line (client/src/seasons.js) (session 20)
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
        ├── hooks.js        useApi(path), useMeta(), usePolling(fn, ms, enabled)
        ├── styles.css      The whole design system
        ├── components/
        │   ├── Layout.jsx  Top bar + unread badges (messages, 🔔) + page outlet
        │   ├── TabBar.jsx  Bottom tab bar on phones/tablets (under 900 px, members only) (session 13)
        │   ├── PushSettings.jsx   "Notifications on this phone" card: turn on, test, turn off (session 15)
        │   ├── ProfileEditor.jsx  Photo, name, city, bio, interests — Account page + Welcome (session 13)
        │   ├── PhotoPicker.jsx    Choose photos with previews, shrinks them first (session 13)
        │   ├── Lightbox.jsx       Full-screen photo viewer: swipe, arrow keys, Esc (session 13)
        │   ├── Celebrate.jsx      celebrate(): toast + confetti; <Celebrations/> sits in Layout (session 20)
        │   ├── ShareButton.jsx    "↗ Share" a request: phone share sheet, or WhatsApp / Copy link (session 20)
        │   ├── Stories.jsx        StoryCard, StoriesStrip, StoryForm — "Found it" stories (session 20)
        │   └── ui.jsx      ErrorBox, Loading (skeleton) + CardsLoading, badges, Avatar (photo or first letter), ListingCard, VerifyPrompt, route guards, Activity, Badges (session 20)
        └── pages/
            ├── Browse.jsx          Visitors' home + /browse: hero, search, request grid, paging
            ├── Home.jsx            Members' home: needs attention, my requests, saved, requests for you (session 13)
            ├── Welcome.jsx         Welcome step after email confirm: photo, bio, interests (session 13)
            ├── Saved.jsx           Saved requests (session 13)
            ├── Notifications.jsx   The 🔔 page; wording per `kind` (session 13)
            ├── ListingDetail.jsx   Request page: OfferPanel (vendor) / OwnerPanel (buyer), ReportLink
            ├── NewListing.jsx      Post + edit a request
            ├── MyListings.jsx
            ├── Inbox.jsx           Conversations grouped by request, tabs received/sent
            ├── Conversation.jsx    Chat with polling + photos; OfferCard, AnswerLine, QuickReplies, StoryForm in the deal banner (session 20)
            ├── Login.jsx  Register.jsx  VerifyEmail.jsx (+ Steps bar)  Verification.jsx (KYC)
            ├── ForgotPassword.jsx  ResetPassword.jsx
            ├── Account.jsx (profile + change password)  NotFound.jsx
            ├── MemberProfile.jsx   Public profile + reviews (session 09); photo, bio, interests, open requests (session 13)
            └── admin/AdminHome.jsx (stats, KYC queue, reports)  admin/KycReview.jsx
```
