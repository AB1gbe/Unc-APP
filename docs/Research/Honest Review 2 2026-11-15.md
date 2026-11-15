---
tags: [research, review]
date: 2026-11-15
---
# Honest Review 2 (after PR #43)

Asked: "give me your no bullshit feedback again". Based on the live site (phone and desktop screenshots) and the code. Follows [[Honest Review 2026-11-15]].

## Wrong or contradicting text (quick fixes)
1. The home safety strip says "Everyone who posts or replies has passed an ID check". **Not true since the trust ladder** ([[ADR-080 Trust ladder]]): replying only needs an email code (`client/src/pages/Board.jsx`).
2. Sign-up says a person is "Buying for myself or finding items as a freelancer", and Wanted says "Shops and finders answer". This is the old "finder" idea, which conflicts with [[ADR-081 Launch focus]] (`Register.jsx`, `Browse.jsx`).
3. A business is "A shop or company selling products", but landlords, agents and employers post Housing and Jobs.
4. The tab is called "Wanted" but the page title is "Requests".

## The home page on a phone
- 12 full-width photo cards in Today's picks make the page about 7,500px tall. Jobs, Wanted and shops sit at the very bottom, so Unc's own idea is buried under a For sale and Housing feed.
- Two big green buttons pull different ways: "+ Sell" (For sale) and "Post what you need" (Wanted).
- Wanted requests show stock photos (a vase on a table for "need a dining table"). A request has nothing to photograph yet, so it looks like an ad for sale.

## The biggest risk: the business, not the code
- 102 sessions and 225 tests, but zero real users. Every new feature now costs more than it earns.
- **Posting needs a hand-checked ID.** That is fine for housing, jobs and shops. For a person selling a used bike, OpenSooq and Facebook take one minute, so For sale will stay empty. Suggest a phone code for casual sellers and an ID check for housing, jobs and businesses.
- There is no real email provider, so sign-up codes can't reach real people. This blocks everything.
- Unc competes with OpenSooq, Facebook groups and Instagram shops. Unc should only lead with what they can't do, Wanted: "tell shops what you need, they compete". Housing and Jobs are a second step.

## Recommended order
1. Fix the wrong texts (1–4).
2. Phone: show 6 picks and put Wanted higher. Requests without a photo show an icon card, not a stock photo.
3. Decide on a lighter check for casual For sale sellers.
4. Set up real email, then stop building and get 20–30 shops ([[Launch Plan]]).
