---
tags: [feature, ratings]
---
# Ratings

**Why this design:** [[ADR-015 Ratings]]. **Build steps:** [[Step 16 - Ratings]].
**Where:** `server/src/lib/ratings.js` (rules), `server/src/routes/ratings.js` (rate + profiles), `server/src/routes/listings.js` (deal on "fulfilled"), `server/src/routes/conversations.js` (deal state in chats), `client/src/pages/ListingDetail.jsx` (seller chooser), `Conversation.jsx` (`DealBanner`), `MemberProfile.jsx`, `components/ui.jsx` (`Stars`, `RatingBadge`, `StarInput`).

## The journey
| Step | Screen |
|---|---|
| 1. Buyer clicks **I found it — mark fulfilled** → picks the seller (or "someone else") | ![[21-pick-seller.png]] |
| 2. Inside that conversation a green **Deal done!** box asks for 1–5 stars + optional comment | ![[22-rate-form.png]] |
| 3. After rating: "Waiting for … to rate you" (blind) | ![[23-rated-waiting.png]] |
| 4. Once both rated, each sees the other's rating | ![[24-both-rated.png]] |
| 5. Public profile with average and reviews (click any member name) | ![[25-profile.png]] |

## Rules
| Rule | Why | Enforced in |
|---|---|---|
| Only a **deal** can be rated — the buyer picked the seller when marking fulfilled | Stops fake reviews from people who never traded | `deals` table; rating endpoint needs a deal id |
| Only the buyer and that seller can rate; outsiders get 404 | Privacy, no probing | `routes/ratings.js` |
| **One rating per side per deal**, can't be edited | Simple and honest | `UNIQUE(deal_id, rater_id)` |
| 1–5 whole stars; comment optional, max 500 chars | | `v.int(min 1, max 5)` + DB `CHECK` |
| **Blind:** hidden until both rated, or 14 days pass | Nobody can wait for a bad review and retaliate | `VISIBLE` SQL condition in `lib/ratings.js` |
| Rating window: 30 days after the deal | Reviews about recent experiences only | `canStillRate()` |
| Buyer may switch/undo the deal (pick another seller, reopen) **until someone rates** | Fix a mis-click, but no wiping a rating | `/status` route → 409 once rated |
| Profiles only for verified, non-banned members; show name, business/individual, member since, deals, rating, reviews — **no email, no city, no message button** | MUST #3: contact stays listing-only | `GET /api/members/:id` |

## Where ratings show
- Next to names: chat header, offers list on your request, seller chooser, buyer box on a request page → "★ 4.5 (12)" or "No ratings yet".
- Inbox: yellow **★ Rate** badge on deals you haven't rated.
- Account page: "View my public profile & ratings →".

## Demo data
`npm run seed` creates one finished deal between `buyer@demo.local` and `vendor@demo.local`, rated 5★ both ways.

## Tests
`server/test/ratings.test.js` (12): deal creation; no deal when bought elsewhere; foreign conversation rejected; blind reveal; 14-day reveal; 30-day window; one per side + star validation; only participants; switch/undo until rated; reopen removes unrated deal; profile privacy and no messaging route; buyer rating on request page. Browser: `e2e/smoke.mjs` runs the whole journey.
