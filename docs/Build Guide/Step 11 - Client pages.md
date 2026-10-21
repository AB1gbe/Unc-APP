---
tags: [build-guide, client]
step: 11
---
# Step 11 — Client pages

## Routing (`src/App.jsx`)
| URL | Page | Guard |
|---|---|---|
| `/` | Browse | — |
| `/requests/new`, `/requests/:id/edit` | NewListing | RequireAuth + RequireVerified |
| `/requests/:id` | ListingDetail | — |
| `/my-requests` | MyListings | RequireAuth |
| `/messages`, `/messages/:id` | Inbox, Conversation | RequireAuth |
| `/login`, `/register` | | — |
| `/verify-email`, `/verification`, `/account` | | RequireAuth |
| `/admin`, `/admin/kyc/:id` | AdminHome, KycReview | RequireAdmin |

Guards live in `components/ui.jsx`. `RequireVerified` doesn't redirect — it shows `VerifyPrompt`, which says exactly what's missing.

## Page notes
- **Register:** two big radio cards "A person / A business" → `accountType`. Then → `/verify-email` with `devCode` in router state.
- **VerifyEmail:** numeric code box, resend link, exports `<Steps current={n}/>`.
- **Verification:** four states (unverified / rejected with reason / pending / approved). `FileField` shows an image preview via `URL.createObjectURL` (needs CSP `blob:` — [[Mistakes and Fixes#M9]]). Fields for back-of-ID and business docs appear only when needed.
- **ListingDetail:** owner sees `OwnerPanel` (edit, mark fulfilled, close, list of offers). Others see `OfferPanel` (verify prompt / existing conversation link / offer form). On 409 it jumps to the existing conversation.
- **Inbox:** groups conversations by request; tabs *All / Offers I received / Offers I sent*.
- **Conversation:** polls every 4 s with `?after=`, dedupes ([[Mistakes and Fixes#M8]]), Enter sends / Shift+Enter new line, price box for vendors only, read-only banner when the request is closed.
- **Layout:** top bar; unread badge (15 s + page change + `unc:read` event — [[Mistakes and Fixes#M11]]).
- **Admin:** stats tiles, KYC queue tabs, reports with read/ban/resolve. KycReview shows details table, document images, checklist, quick reject reasons.

## Build
```bash
npm run build     # → client/dist
npm start         # Express serves the site + API on :4000
```

Next → [[Step 12 - End-to-end check]]
