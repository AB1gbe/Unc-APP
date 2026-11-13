---
tags: [feature]
session: 88
---
# Business accounts and billing

Decision: [[ADR-077 Business accounts, paying for ads and teams]]. Build: [[Step 74 - Business panel, billing and teams]].

## Signing up as a business
Same steps as a person, plus on the identity page:
- registered business name;
- **CR number**, written like **12345-1** (CR number, then branch). Unc also accepts "12345", "12345/1" and spaces, and stores 12345-1;
- the **CR certificate from Sijilat** (photo or PDF).

One CR can verify only one business account (error "This CR is already used…").

## Paying for ads (like Craigslist)
- People: everything free.
- Businesses:
  - For sale **BD 1**, Housing **BD 3**, Jobs **BD 5** per ad;
  - Wanted requests and offers are free.
- The posting form says before posting: "This ad costs BD 3, paid from your ad credit (BD 8.000 left)" or "…your card ending 4242 will be charged".
- Ad credit first, then the saved card. A declined card means the ad isn't created.
- Packs (Billing tab): pay BD 10 → BD 11 credit; BD 25 → BD 28; BD 50 → BD 57.500.
- Every card payment: a receipt (`/business/receipts/:id`, printable) with number UNC-YYYY-NNNNNN, business name, CR, card, amount, and who posted.

## Business panel (`/business`)
Menu: **Business panel** (side bar), a card on My Unc, a link on Account.
- **Dashboard:**
  - this week vs last week: people who looked at your ads, replies, offers you sent, ads posted (▲ green, ▼ red);
  - open ads, unread messages, ad credit.
- **Ads:** every ad and request with views, replies, status, "Being checked" and who posted it.
- **Billing:** ad credit, prices, packs (owner only), payments and receipts.
- **Team** (owner only): invite by email (up to 10), see members and pending invites, remove someone (they are logged out of the business at once).

## Team members
- Anyone with a Unc account (email confirmed) can be invited. They get a 🔔 and an email, then open **Teams** (`/team`, also on Account) → **Join**.
- **Switch to this business**: they now post, reply and use the panel **as the business**. A blue bar says "You are using X as Y. [Switch back]".
- The business pays for their ads; the Ads tab and receipts show who posted.
- They can't:
  - buy credit, change the card or see the team;
  - change the password or profile;
  - do the identity check, export data or delete the account.

  The server refuses these (403).
