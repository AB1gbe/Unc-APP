---
tags: [feature, profiles]
---
# Profiles, Welcome step and member Home

**Why this design:** [[ADR-018 Profiles and onboarding]]. **Build steps:** [[Step 18 - Profiles, welcome and home]].
**Where:** `server/src/routes/auth.js` (`PATCH /me`, `/avatar`, `/onboarded`), `server/src/middleware/auth.js` (`publicMe`, `parseInterests`), `server/src/routes/ratings.js` (`GET /api/members/:id`), `server/src/routes/listings.js` (`GET /for-you`), `client/src/components/ProfileEditor.jsx`, `client/src/components/ui.jsx` (`Avatar`), `client/src/pages/Welcome.jsx`, `Home.jsx`, `Account.jsx`, `MemberProfile.jsx`.

## The journey
| Step | Screen |
|---|---|
| 1. Sign up → confirm email → **Welcome**: photo, a few words, what you buy/sell. "Save and continue" or "Skip for now" | ![[s13-welcome.png]] |
| 2. Identity check (as before) | — |
| 3. **Home** (`/` when logged in): profile checklist with progress bar, *Needs your attention*, *Your open requests*, *Saved for later*, *Requests you could help with* | ![[s13-home.png]] |
| 4. **Public profile** (click any name): photo, bio, city, interests, rating and reviews, "Looking for right now" | ![[s13-profile.png]] |

## Rules
| Rule | Why | Enforced in |
|---|---|---|
| Profile photo is optional and **never the KYC selfie** | KYC files stay private | separate `uploads/avatars` folder |
| Photo: JPEG/PNG/WebP, checked by file content, shrunk in the browser; replacing deletes the old file | Safety, storage | `saveFiles()` + `POST /api/auth/avatar` |
| Bio max 300 characters; interests: up to 8 of the request categories | Short and matchable | `PATCH /api/auth/me` |
| Welcome shows once: finishing or skipping sets `onboarded_at` | Never nags | `POST /api/auth/onboarded`; `VerifyEmail.jsx` goes to `/welcome` only if not onboarded ([[Mistakes and Fixes#M48]]) |
| "Requests you could help with": open, not yours, not already answered, in your interests (all if none), **same city first**, max 6 | Useful, not spammy | `GET /api/listings/for-you` |
| Profiles have **no message button** | MUST: contact only about a request | `MemberProfile.jsx` |
