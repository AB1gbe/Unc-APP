---
tags: [feature]
---
# Orders, wallet, refer a friend, short videos (session 58)

Ideas 3–5 from [[Siin Competitor Study#9. Ideas worth borrowing (fit Unc's rules)]], built in [[2026-11-08 Session 58]]. Contact still happens only inside a request's chat.

## 1. Orders and the wallet
**Why:** [[ADR-056 Orders and wallet credit]] · **Build:** [[Step 56 - Orders and wallet]]
**Where:** `server/src/routes/wallet.js` (`GET /api/orders`, `GET /api/wallet`), `server/src/lib/wallet.js`, `client/src/pages/Orders.jsx` (`/orders`), `client/src/pages/Wallet.jsx` (`/wallet`); links on the Account page.

![[s58-orders.png]]

- **Orders** lists every chat where a price was **accepted** or a deal was recorded, in two tabs, like Siin's Orders page.
  - **In progress:** "Price agreed · not marked found yet", "Paying in parts" (with payments left), "★ Rate them".
  - **Completed:** "Done ✓", or "Closed without this deal".
  - Each order shows the item photo, who it's with, the price, and links to its chat. Both buyers and sellers see their own.
- **My wallet** shows **Unc credit** and its history.
  - Credit is **not money yet**: it can't be paid out, and it will count towards Unc's fees once Unc charges any (after Tap Payments is connected).
  - It's stored as a list of changes in fils (1000 = BD 1). The same reward can never be given twice.
- Payment still goes directly between buyer and seller; the page says so.

## 2. Refer a friend
**Why:** [[ADR-057 Refer a friend]] · **Build:** [[Step 57 - Refer a friend]]
**Where:** `server/src/lib/referrals.js`, `GET /api/referrals`, `client/src/pages/Invite.jsx` (`/invite`), the note on `Register.jsx`.

![[s58-invite.png]]

- Every member has an **invite link** (`/register?ref=CODE`), with **Copy** and **Share** (the phone's share sheet, or WhatsApp on a computer).
- A friend who signs up with it sees "🎁 A friend invited you".
- When the friend is **fully verified** (email, identity check **and** payment card, in any order), the inviter gets **BD 1.000** of Unc credit and the friend **BD 0.500**, once. The inviter also gets a 🔔.
- The inviter sees only **counts** (joined, verified, credit earned), never who.
- Fake accounts earn nothing: one real person can only verify one account (KYC).
- The link is built from the address the page is opened at, so it also works on a phone test address ([[Mistakes and Fixes#M108]]).

## 3. Short videos with offers and in chats
**Why:** [[ADR-058 Short videos in chats]] · **Build:** [[Step 58 - Short videos in chats]]
**Where:** `server/src/lib/uploads.js` (`sniffVideo`, `saveVideo`), `server/src/routes/conversations.js`, `client/src/components/VideoPicker.jsx`, `client/src/videos.js`.

![[s58-chat-video.png]]

- A seller can add a **short video** to an offer ("Short video of your item"), and anyone in a chat can send one with the 🎬 button.
- Limits: up to **1 minute** (checked in the browser) and **25 MB**; MP4, iPhone MOV or WebM, checked by the file's first bytes on the server.
- **Private like chat photos:** only the chat's two members can play it (admins only through a report, logged). Phones can skip through it (the server answers "Range" requests).
- The inbox shows "🎬 Video", and Compare offers shows a "🎬 Video" badge for sellers who sent one.
