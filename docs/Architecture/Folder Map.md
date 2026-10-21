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
├── e2e/smoke.mjs           Playwright browser test (screenshots → e2e/screenshots/, git-ignored)
├── server/
│   ├── package.json        Server deps + scripts
│   ├── data/               (created at runtime, git-ignored) database + uploads
│   ├── src/
│   │   ├── index.js        Starts the server (opens DB, ensures admin, listen)
│   │   ├── app.js          Builds the Express app: security headers, routes, static files
│   │   ├── config.js       All settings from environment variables
│   │   ├── db.js           SQLite connection, MIGRATIONS list, tx() and audit() helpers
│   │   ├── seed.js         ensureAdmin() + demo data (npm run seed)
│   │   ├── mail-test.js    Sends one test email (npm run mail:test -- you@example.com)
│   │   ├── lib/
│   │   │   ├── crypto.js       scrypt passwords, tokens, sha256, peppered HMAC, 6-digit codes
│   │   │   ├── http.js         HttpError + JSON error handler
│   │   │   ├── validate.js     Input validators (str, int, email, isoDate, password, ageOn…)
│   │   │   ├── uploads.js      Multer in-memory uploads, magic-byte sniffing, saveFile()
│   │   │   ├── mailer.js       sendMail()/trySendMail(): console | memory | smtp (nodemailer) | resend
│   │   │   ├── emails.js       Text + HTML of every email (code, reset link, password changed)
│   │   │   └── categories.js   CATEGORIES + CURRENCIES lists
│   │   ├── middleware/auth.js  loadUser, requireAuth, requireVerified, requireAdmin, publicMe
│   │   ├── kyc/
│   │   │   ├── index.js        getProvider(), applyDecision()
│   │   │   └── providers/      manual.js (+ README on adding Stripe/Persona…)
│   │   └── routes/
│   │       ├── auth.js          /api/auth/* (incl. forgot/reset/change password)
│   │       ├── kyc.js           /api/kyc (submit + status), sendKycFile()
│   │       ├── listings.js      /api/listings/*
│   │       ├── conversations.js /api/listings/:id/contact, /api/conversations/*, /api/reports
│   │       └── admin.js         /api/admin/*
│   └── test/
│       ├── helpers.js          In-memory app + user factory (any verification stage)
│       ├── kyc.test.js
│       ├── messaging.test.js
│       ├── password.test.js
│       └── mail-transports.test.js
└── client/
    ├── package.json
    ├── index.html          The single HTML page React mounts into
    ├── vite.config.js      Dev server :5173 + proxy to :4000
    └── src/
        ├── main.jsx        Mounts <App/> with Router + AuthProvider
        ├── App.jsx         All page routes + guards
        ├── api.js          api() fetch wrapper, money/budget/date helpers
        ├── auth.jsx        AuthProvider, useAuth(), isVerified()
        ├── hooks.js        useApi(path), useMeta()
        ├── styles.css      The whole design system
        ├── components/
        │   ├── Layout.jsx  Top bar + unread badge + page outlet
        │   └── ui.jsx      ErrorBox, Loading, badges, Avatar, ListingCard, VerifyPrompt, route guards
        └── pages/
            ├── Browse.jsx          Home: hero, search, request grid, paging
            ├── ListingDetail.jsx   Request page: OfferPanel (vendor) / OwnerPanel (buyer), ReportLink
            ├── NewListing.jsx      Post + edit a request
            ├── MyListings.jsx
            ├── Inbox.jsx           Conversations grouped by request, tabs received/sent
            ├── Conversation.jsx    Chat with polling
            ├── Login.jsx  Register.jsx  VerifyEmail.jsx (+ Steps bar)  Verification.jsx (KYC)
            ├── ForgotPassword.jsx  ResetPassword.jsx
            ├── Account.jsx (profile + change password)  NotFound.jsx
            └── admin/AdminHome.jsx (stats, KYC queue, reports)  admin/KycReview.jsx
```
