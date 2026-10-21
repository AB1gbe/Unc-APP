---
tags: [architecture, api]
---
# API Reference

All JSON (gzip-compressed when larger than 1 KB). Upload mistakes → 400/413, unreadable JSON → 400. Errors: `{ "error": "message", "field"?: "...", "code"?: "..." }`. Auth = session cookie.
Gate legend: — public · **A** logged in · **V** verified (email + KYC) · **ADM** admin.

## Meta
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/health` | — | `{ok:true}` |
| GET | `/api/meta` | — | categories + currencies |

## Auth — `server/src/routes/auth.js`
| Method | Path | Gate | Body → Response |
|---|---|---|---|
| POST | `/api/auth/register` | — | `email, password, displayName, accountType, city?` → `201 {user, devCode?}` + cookie |
| POST | `/api/auth/login` | — | `email, password` → `{user}` + cookie |
| POST | `/api/auth/logout` | — | clears session |
| GET | `/api/auth/me` | — | `{user}` or `{user:null}` |
| PATCH | `/api/auth/me` | A | `displayName, city?` |
| POST | `/api/auth/verify-email` | A | `code` (6 digits). 5 wrong tries → 429 |
| POST | `/api/auth/resend-code` | A | `{ok, devCode?}` |

| POST | `/api/auth/forgot-password` | — | `email` → always `{ok, message}` |
| POST | `/api/auth/reset-password/check` | — | `token` → `{ok}` or 400 `code: RESET_INVALID` |
| POST | `/api/auth/reset-password` | — | `token, password` → `{ok}`; ends all sessions |
| POST | `/api/auth/change-password` | A | `currentPassword, password` → `{ok}`; ends other sessions |

`register` also returns `emailSent: true/false`. `devCode` is included **only when NODE_ENV ≠ production and MAIL_TRANSPORT is console** (or in tests). `resend-code` → 502 if the email couldn't be sent.

## KYC — `server/src/routes/kyc.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/kyc` | A | `{kycStatus, submission}` (own, safe fields) |
| POST | `/api/kyc` | A + email verified | **multipart**: `legalName, dateOfBirth, country, idType, idNumber, businessName*, businessRegNumber*` + files `docFront, docBack (not for passport), selfie, businessDoc*` (*business accounts) |

## Requests — `server/src/routes/listings.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/api/listings?q=&category=&city=&page=` | — | open only, 20/page (page capped at 10,000), `{listings, page, hasMore}` |
| GET | `/api/listings/mine` | A | all statuses |
| GET | `/api/listings/:id` | — | non-open visible to owner, vendors with a conversation on it, admins; banned buyer's → 404 (except admins); adds `myConversationId` for vendors |
| POST | `/api/listings` | V | multipart: `title, description, category, budgetMin?, budgetMax?, currency?, city, neededBy?` + up to 3 `images` |
| PATCH | `/api/listings/:id` | V owner | JSON, open only |
| POST | `/api/listings/:id/status` | A owner | `status: open/fulfilled/closed`, optional `conversationId` with `fulfilled` = record the deal. 409 if changing a deal that was already rated |

## Conversations — `server/src/routes/conversations.js`
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/listings/:id/contact` | V, not owner | `message, offerPrice?` → **the only way to start a conversation**. 409 + `conversationId` if exists |
| GET | `/api/conversations` | A | my inbox with `lastMessage`, `unread`, `myRole` |
| GET | `/api/conversations/unread-count` | A | `{unread}` |
| GET | `/api/listings/:id/conversations` | A owner | offers on my request |
| GET | `/api/conversations/:id?after=<msgId>` | A participant | messages (only newer than `after`); marks other side's as read. Outsiders → 404 |
| POST | `/api/conversations/:id/messages` | V participant | `message, offerPrice?` (vendor only). 409 if request not open or the other member is suspended |
| POST | `/api/reports` | A | `reason, listingId? / conversationId?` |

## Ratings & profiles — `server/src/routes/ratings.js` (session 09)
| Method | Path | Gate | Notes |
|---|---|---|---|
| POST | `/api/deals/:id/rating` | A, deal participant | `stars` 1–5, `comment?` (≤500). 404 for outsiders, 409 if already rated or after 30 days |
| GET | `/api/members/:id` | — | verified, non-banned members only: `{member: {displayName, accountType, memberSince, deals, rating}, reviews}` — no email/city, no contact |

Conversation objects also carry `other.rating`, `deal` and `needsRating`; request details carry `buyer.rating` (+ `dealConversationId` for the owner).

## Admin — `server/src/routes/admin.js` (all ADM)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/stats` | counts |
| GET | `/api/admin/kyc?status=pending` | queue |
| GET | `/api/admin/kyc/:id` | details + file URLs + previous attempts |
| GET | `/api/admin/kyc/:id/file/:field` | streams private file (`doc_front, doc_back, selfie, business_doc`), logged |
| POST | `/api/admin/kyc/:id/decision` | `decision: approved/rejected, note` (note required to reject) |
| GET | `/api/admin/reports` | open reports |
| GET | `/api/admin/reports/:id/conversation` | read reported conversation, logged |
| POST | `/api/admin/reports/:id/resolve` | |
| POST | `/api/admin/users/:id/ban` | `banned: true/false` (real boolean, else 400); ban kills sessions |
