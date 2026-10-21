---
tags: [architecture]
---
# Architecture Overview

```
 Browser (React app)                      Node.js server (Express)                 Disk (DATA_DIR)
┌──────────────────────┐   /api/* JSON   ┌───────────────────────────────┐        ┌───────────────────┐
│ pages/  components/  │ ──────────────▶ │ middleware/auth.js  (who?)    │        │ unc.sqlite        │
│ api.js (fetch)       │ ◀────────────── │ routes/*.js        (rules)    │ ─────▶ │ uploads/listings/ │ public
│ auth.jsx (who am I)  │   cookie        │ kyc/               (KYC)      │        │ uploads/kyc/      │ PRIVATE
└──────────────────────┘ unc_session     │ db.js              (SQL)      │        └───────────────────┘
                                         └───────────────────────────────┘
```

- **Development:** two processes. Vite serves the React app on `:5173` and *proxies* `/api` and `/uploads` to Express on `:4000` (`client/vite.config.js`). The browser only sees `:5173`, so the session cookie works without CORS.
- **Production:** one process. `npm run build` writes the React app to `client/dist`; Express serves it and the API on the same port (`server/src/app.js`, bottom).

## A request's life (example: vendor makes an offer)
1. User clicks **Send offer** → `ListingDetail.jsx` → `api('/listings/7/contact', {method:'POST', body:{message, offerPrice}})`.
2. Browser sends cookie `unc_session`.
3. `loadUser` (middleware) hashes the cookie, finds the session, puts the user on `req.user`.
4. `requireVerified` checks email verified + `kyc_status = 'approved'` → else **403** with `code: 'KYC_REQUIRED'`.
5. Route in `conversations.js` checks: listing exists, is open, not your own, no existing thread → validates input → inserts conversation + first message **in one transaction** → writes `audit_log`.
6. Returns **201** with the conversation; UI navigates to `/messages/<id>`.
7. Errors anywhere are `throw new HttpError(status, message)` → `errorHandler` turns them into `{ error: "..." }` JSON → `api.js` throws → pages show it in `<ErrorBox>`.

## Permission gates (server/src/middleware/auth.js)
| Gate | Allows |
|---|---|
| none | Browse/search open requests, view a request, register, login, forgot/reset password |
| `requireAuth` | Logged in & not banned: inbox, read own conversations, account, submit KYC, close own request, report |
| `requireVerified` | + email verified + KYC approved: **post/edit requests, make offers, send messages** |
| `requireAdmin` | Admin role: KYC queue/decisions, view KYC files, reports, bans |

See also [[Folder Map]], [[Database Schema]], [[API Reference]].
