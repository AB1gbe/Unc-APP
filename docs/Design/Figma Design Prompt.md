---
tags: [design, figma, prompt]
date: 2026-11-12
---
# Figma design prompt for Unc

Copy everything inside the box below into Figma AI (First Draft / Make), or send it to a designer. It sums up everything learned while building Unc (sessions 54–74). See also [[Design System]], [[Marketplace Design Study]], [[ADR-064 Less AI-looking details]], [[ADR-066 Calm home page and tabs]], [[ADR-067 App-style side bar]].

````text
Design a complete mobile app (iOS + Android) and a matching desktop web app in Figma for "Unc", a reverse marketplace for Bahrain.

## 1. What Unc is
- Buyers post what they want ("Looking for a used PS5 with 2 controllers, BD 120–150, Riffa"). Verified shops and "finders" (people who source items) reply with private offers. The buyer compares offers, agrees a price in the chat, and both rate each other.
- Shops come first: Unc is mainly a place where real, verified Bahraini businesses compete for a buyer's request. Individuals post requests; shops answer them.
- Trust is the product: every member passes an ID + selfie check and adds a payment card before posting or offering. Shops show a verified tick, area, rating and number of sales.
- Hard rule: sellers can only contact a buyer inside one request's private chat. There is NO direct messaging, no "message this shop" button, no public comments. Phone numbers and links are hidden in chat until a price is agreed.
- Languages: English and Arabic. Every screen must work right-to-left. Currency: Bahraini Dinar (BD, 3 decimals, e.g. BD 12.500). Places: Bahrain areas (Manama, Juffair, Seef, Riffa, East Riffa, Isa Town, Hamad Town, Sitra, Muharraq, Budaiya, Saar, Amwaj…).

## 2. The look the owner wants
- It must feel like a native APP, not a website. Calm, premium, grown-up, dark. Reference mood: Siin (Gulf collectors' app), Vinted/Depop/Grailed for photo-first listings, Noon/Talabat for category grids, Instagram/X for app navigation.
- Dark theme only. Background #0B0C0F, surfaces #15171C and #1D2027, borders #262A32, text #F2F2F4, muted text #9BA1AB.
- One accent: warm coral #FF7A4D, used only for actions (main buttons, links, active tab, unread counts). Text on coral is near-black #1B0D06. Success #4FD18B, warning #F2B34F, error #FF6B6B.
- Fonts: Plus Jakarta Sans for English (headings 700, text 400–600) and Almarai for Arabic. Tight letter spacing on headings.
- Corners: small, 6px on cards and tiles, 8px on large panels. Photos are NOT rounded on their own. Only avatars are circles. The floating tab bar is the one exception (22px pill).
- Photography first: real product and shop photos everywhere (no illustrations, no 3D, no emoji art). A request without a photo shows its category photo labelled "Example picture".
- "Back-glow": a soft, blurred, low-opacity glow in each photo's own colours spreading behind its card (about 35% opacity, gentle; it must never look neon or bright).
- Icons: thin line icons (Phosphor style, regular weight), one size. No emoji anywhere in the interface.
- Prices in white, bold. Category names as small uppercase grey labels (not coloured pills).

## 3. What the owner rejected (do NOT do these)
- Anything that looks AI-generated: purple/blue gradients, everything wrapped in rounded boxes, soft generic drop shadows, Inter everywhere, three "feature cards" with icons, numbered "How it works" steps, vague marketing copy.
- Bright pastel or cartoon illustrations (felt childish).
- Emoji in headings, lists or buttons.
- A website-style top navigation bar on desktop.
- A home page flooded with sections (16 category tiles, steps, feeds all at once).
- Glows that are too bright or saturated.
- Blue system bars (status bar / Android navigation bar must be #0B0C0F).
- Full-width giant search buttons on mobile.

## 4. Navigation
Mobile:
- Slim top header: "unc" logo (lowercase, "c" in coral) on the start side; bell with unread badge and a small language switch ("العربية"/"English") on the end side. Visitors see small "Log in" and "Sign up" instead of the bell.
- Floating glass tab bar: detached from the screen edges (14px sides, 10px above the bottom safe area), 64px tall, 22px radius, translucent dark glass (rgba(28,31,38,0.55)) with a 20px background blur and a hairline light border. Active tab: coral icon + label and a soft highlight.
  - Visitors: Home · Requests · Shops · Categories.
  - Members: Home · Requests · (+ Post, a round coral button in the centre) · Messages · Account.
Desktop / tablet (900px+):
- A side bar on the start side (left in English, right in Arabic), 248px wide, collapsible to a 76px icon rail with a toggle next to the logo. Items: Home, Requests, Shops, Categories, Messages (badge), Notifications (badge), My requests, then a coral pill "+ Post a request", and at the bottom: language switch and the member's photo + name ("Account"). Show both the open and the collapsed state.

## 5. Screens to design (mobile 390×844 first, then desktop 1440×900 for the main ones; every screen also in Arabic RTL)
1. Splash + onboarding (3 short, photo-led slides): post what you need → verified shops send offers → agree in the chat. Choose language.
2. Sign up: choose "A business" (listed first) or "A person"; name, email, password, area; accept Terms. Email code screen.
3. Verification flow: ID front/back + selfie upload with progress, business registration (CR) for shops, "under review" state, then "Add a payment card" (no money taken).
4. Home (visitor, calm): hero line "Need something? Post it. Bahrain's shops come to you." with one coral button; "Verified shops" row (4 shop cards + "All shops"); "Browse by category" (4 categories + an "All categories" tile); "Latest requests" (3 cards + "All requests"). Nothing else.
5. Home (member): greeting with avatar; small live counters ("3 requests posted today · 5 offers made today"); "Needs your attention" list (new offers, rate your deal); "Your open requests"; "Requests you could help with" (for sellers).
6. Requests tab: title + one search field with a small square search-icon button beside it; category and area pickers under it; grid/list of request cards; empty state; activity list at the bottom ("Someone in Juffair found what they needed in Electronics").
7. Request card: square or 4:3 photo with back-glow, category label, price range, title (2 lines max), area · time · offers count, optional "Closes in 2 days" badge, optional "Shops only" badge.
8. Request detail: photo gallery (full-screen viewer), title, budget, area, needed-by date, description, buyer (first name + verified tick + rating), "Have this? Make an offer" for sellers; for the owner: offers list, "Compare offers" table (price, rating, reply speed, photo), views count, tips, "Keep it open", "I found it", "Raise my budget".
9. Make an offer: price, condition, delivery/pickup, photo or 1-minute video, message.
10. Chat (one per request): request header pinned at the top; bubbles (mine in coral, theirs in surface grey); offer cards (Offer BD 380 · Accept / Counter / Decline); hidden phone numbers shown as "Hidden until you agree a price" with a gentle nudge; photo and video messages; "Deal done" banner; pickup checklist; paying-in-parts plan card; rating form (stars + comment); Report and Block.
11. Shops tab: search field ("Shop name, area or what they sell"), shop cards (cover photo, name + verified tick, area, rating, sales), "Found on Unc" member stories underneath.
12. Shop page: cover photo, logo, verified tick, area, opening hours (open/closed now), rating and reviews, badges (Fast responder, Top finder), "Favourite", their open requests. No message button.
13. Categories tab: search field; grid of 16 square category photos with the name on a dark fade at the bottom (Electronics, Phones & Tablets, Computers, Home & Furniture, Appliances, Vehicles & Parts, Fashion, Beauty & Health, Sports & Outdoors, Toys & Kids, Books & Media, Tools & DIY, Garden, Pets, Services, Other).
14. Post a request: step-by-step (what, photos up to 6, category, budget range in BD, area, needed by, who may contact me: everyone / shops only / 4★+ sellers / my favourite sellers), review and post, success state.
15. Messages inbox: one row per request conversation (avatar, name, request title, last message, unread badge).
16. Notifications: grouped list with line icons (new offer, deal, rating, identity approved, alert match, payment part due…).
17. Account: profile (photo, bio, interests), shop page editor for businesses (cover, area, hours), Orders, Wallet (Unc credit), Invite friends, Request alerts, Saved requests, Favourite sellers, Away mode, Notification settings, Payment card, Download my data, Delete account, Help, Terms, Log out.
18. Orders + Wallet + Invite friends (referral link and credit).
19. Help: FAQ by topic with small photo tiles, and "Contact the Unc team" (a ticket thread with the team; not member-to-member).
20. Admin (desktop only): ID checks queue, reports, help questions, owner dashboard.

## 6. States and details
- Loading skeletons, empty states (with one clear next action), errors, offline.
- Unread dots, badges (open, closes soon, verified, shops only).
- Arabic RTL versions of Home, Requests, Request detail, Chat and Account at least, with mirrored layout and Arabic numerals left as Western digits.
- Touch targets at least 44px; bottom content padded so the floating tab bar never covers it.
- Accessibility: 4.5:1 contrast for text, visible focus states.

## 7. Deliverables
- A small design system page: colour tokens, type scale (Plus Jakarta Sans + Almarai), spacing (4/8 grid), radius (6/8/22/circle), icons, back-glow effect, glass tab bar, buttons (primary coral, secondary outline, small), inputs, search field + icon button, cards (request, shop, category, offer), badges, avatars, chat bubbles.
- Components with variants (English/Arabic, visitor/member, active/inactive).
- A clickable prototype for: visitor home → Categories → category results → request detail → Sign up; and member: Post a request → receive offer → chat → accept → rate.
- Use realistic Bahraini content (names like Fatima Ali, Hussain Mahdi; shops like Riverside Electronics – Seef, Manama Phone Fix – Manama Souq, Riffa Auto Parts – East Riffa, Muharraq Home & Furniture) and real-looking product photos.
````

## How to use it
- **Figma AI (First Draft / Figma Make):** paste the whole box. If it's too long, paste sections 1–4 first, then ask for screens a few at a time from section 5.
- **A designer:** send this note and the screenshots in [[Design System]].
