---
tags: [feature, ux, social]
---
# Social touches: making Unc feel human (session 20)

The five "recommended first" ideas from [[Social Marketplace Ideas]], all built in [[2026-10-21 Session 20]]. Each keeps the MUST: people only talk inside a request's conversation.

## 1. Warmer wording, greetings, celebrations, loading placeholders
**Why:** [[ADR-024 Warm wording and celebrations]] · **Build:** [[Step 24 - Warm wording and celebrations]]
**Where:** `client/src/seasons.js`, `client/src/components/Celebrate.jsx`, `Loading`/`CardsLoading` in `client/src/components/ui.jsx`, `client/src/pages/Home.jsx`

| Found it! (confetti + message) | Arabic home on a phone: greeting by time of day |
|---|---|
| ![[s20-found-it.png]] | ![[s20-ar-phone-greeting.png]] |

- **Greeting:** "Good morning / afternoon / evening, {name}". Under it, during Ramadan, the two Eids and Bahrain National Day (16–17 Dec), a seasonal line. The dates come from the browser's Umm al-Qura calendar, so there is no list to update.
- **Celebrations:** confetti and a message after posting a request, finding it, agreeing a price, a 4–5★ rating and sharing a story. Phones set to "reduce motion" get the message without confetti.
- **Warmer words:** "I found it! 🎉", a "found" badge, friendlier empty pages.
- **Loading placeholders:** grey shapes instead of "Loading…". Screen readers still hear "Loading…".

## 2. Offer cards: Accept / Counter / Not for me, and quick replies
**Why:** [[ADR-025 Offer answers in the chat]] · **Build:** [[Step 25 - Offer cards and quick replies]]
**Where:** `server/src/routes/conversations.js` (`/respond`), `OfferCard`, `AnswerLine` and `QuickReplies` in `client/src/pages/Conversation.jsx`

![[s20-offer-accepted.png]]

- Any price in the chat (the seller's offer **or** a buyer's counter-offer) shows as a card.
- The other side's **newest** price gets **Accept**, **Counter** (type a price, no text needed) and **Not for me**. Each price can be answered once; older prices say "Replaced by a newer price".
- After an accept, a green line says "Riverside accepted $350 🤝". The buyer also gets a link: "Got it? Mark the request as found".
- Accepting does **not** close the request or make a deal by itself. The buyer still confirms with **I found it!** after they actually have the item.
- **Quick replies:** chips above the message box. Buyers see "Is it still available?" and "Can you send more photos?"; sellers see "Yes, it's still available." and "I can deliver it." Tapping a chip **fills** the box so you can edit it before sending.

## 3. "Active now", reply time, "people looked at it"
**Why:** [[ADR-026 Activity and privacy]] · **Build:** [[Step 26 - Activity and views]]
**Where:** `server/src/lib/activity.js`, `loadUser` in `server/src/middleware/auth.js`, `Activity` in `ui.jsx`

- **🟢 Active now** (seen in the last 5 minutes), or "Active 2 hours ago" (within a week), plus "Usually replies within an hour / a few hours / a day". The reply time is the median over at least 3 conversations.
- Shown in chats, on profiles and on request pages, **only to logged-in members**, and never about yourself.
- On their own request, the buyer sees "👀 7 people looked at it · 2 offers", and a 👀 count on their request cards. Each logged-in member is counted once; the buyer is never counted.

## 4. Share to WhatsApp, with preview cards
**Why:** [[ADR-027 Link previews]] · **Build:** [[Step 27 - Share and link previews]]
**Where:** `client/src/components/ShareButton.jsx`, `server/src/lib/previews.js`, the page handler in `server/src/app.js`

![[s20-share.png]]

- **↗ Share** on every open request:
  - phones open their own share sheet (WhatsApp, Instagram, Messages…);
  - computers get **WhatsApp** and **Copy link**.
- **Preview cards:** when the link is pasted, the card shows the request's title, price, city and first photo, in the buyer's language. Closed requests and other pages show the general Unc card.
- Previews only work on the **built** app (`npm start`, or once it's online), with `APP_URL` set to the public address. They don't work in `npm run dev`, because WhatsApp can't reach your PC.

## 5. "Found it" stories and earned badges
**Why:** [[ADR-028 Stories and badges]] · **Build:** [[Step 28 - Stories and badges]]
**Where:** `server/src/routes/stories.js`, `server/src/lib/badges.js`, `client/src/components/Stories.jsx`, `Badges` in `ui.jsx`

| Share your story (after rating) | On Home | On the seller's profile, with badges |
|---|---|---|
| ![[s20-story-form.png]] | ![[s20-home-stories.png]] | ![[s20-profile.png]] |

**Stories**
- After rating a deal, the buyer and the seller may each share one sentence (5–280 characters) and a photo. It is optional and public.
- Stories show on Home, on the landing page for visitors, and on both people's profiles.
- The author can delete their story. Admins see a **Hide** button on every story.

**Badges** are earned, never bought:

| Badge | Rule |
|---|---|
| ⚡ Fast responder | Usually replies within an hour (median of 3+ conversations) |
| 🏆 Top finder | 5+ deals as the seller, rated 4.5★ or more (3+ visible ratings) |
| 🤝 Trusted buyer | 3+ deals as the buyer, rated 4.5★ or more (2+ visible ratings) |
| 🌱 New member | Joined in the last 30 days |

## Tests
- `npm test`: `offer-responses.test.js` (3), `activity.test.js` (3), `previews.test.js` (2), `stories-badges.test.js` (3), `seasons.test.js` (2), and index checks in `performance.test.js`.
- `e2e/smoke.mjs` now covers all five features.
