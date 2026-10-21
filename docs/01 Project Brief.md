---
tags: [brief, requirements]
---
# Project Brief

## The idea (in the owner's words)
> I want to create a fully fleshed application similar to Facebook Marketplace and mainly Craigslist. The concept is that I as a consumer might require something to purchase — it might be anything I want — so I post about the listing that I want, so then other people can contact me and approach me with said product. It doesn't matter if it's the shop itself or a freelancer who acts as a third party.

## Who uses it
| Role | What they do |
|---|---|
| **Buyer** (consumer) | Posts a *request*: "I want X, budget Y, in city Z". Receives offers. Replies. Marks the request fulfilled. |
| **Vendor** — a *shop* | Browses requests, contacts buyers about a specific request with an offer. Signs up as a **business** account. |
| **Vendor** — a *freelancer / finder* | Same as a shop but an **individual** account (finds items for people as a third party). |
| **Admin** | Reviews identity documents (KYC), handles reports, bans bad actors. |

Any account can be both buyer and vendor. A "vendor" is just someone making an offer on someone else's request.

## The three MUSTs
1. **Proper KYC verification** → see [[KYC Verification]] and [[ADR-005 KYC approach]]
2. **A simple and understandable design** → see [[Design System]] and [[ADR-009 Styling approach]]
3. **Private contact is ONLY about a specific listing — no free chatting** → see [[Listing-Bound Messaging]] and [[ADR-006 Messaging model]]

## Standing instruction for every session
> Always document everything in Obsidian: HOW it was done, WHY, WHERE, how many options and mistakes we went through, and what we did to fix them. It must be replicable without AI.

This is also written into `CLAUDE.md` at the repository root so any future AI session follows it automatically.

## Added in later sessions
- Session 02: password reset + real email sending ([[Password Reset]], [[Email Sending]]).

## Words we use
- **Request** = **Listing** in the code. A buyer's post saying what they want. (The database table is `listings`.)
- **Offer** = the first message a vendor sends about a request (optionally with a price).
- **Conversation** = the private thread between one buyer and one vendor about one request.

See also [[Glossary]].
