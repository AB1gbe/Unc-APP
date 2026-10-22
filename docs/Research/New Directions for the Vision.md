---
tags: [research, ideas]
date: 2026-10-22
---
# New directions that fit the vision (session 36)

The vision: **buyers post what they want; verified shops and finders contact them privately, only about that request.**
This list avoids repeating [[Social Marketplace Ideas]] (session 19), [[More Ideas for the Vision]] (session 30) and [[Fresh Ideas for the Vision]] (session 33). It also skips what Unc already does: for example, one person can't verify two accounts with the same ID (the identity check refuses an ID number already in use).

Every idea keeps the three MUSTs: proper KYC, simple design, and contact only inside a request.

Effort: **S** = a few hours · **M** = a day or two · **L** = several days. ⚖️ = the owner must decide something first (money, law, an outside service).

## 1. Ready for launch (trust and the law)
| Idea | What it looks like | Why it fits | Effort |
|---|---|---|---|
| **Download my data / delete my account** | Account → "Download my data" (a file with your profile, requests, messages, ratings) and "Delete my account" (with a 7-day undo). Identity documents are wiped; what the law says to keep (e.g. the audit log) stays, without your name | Bahrain's PDPL gives people these rights; trust grows when leaving is easy | M |
| **Report follow-up** | After a report: "Thanks — we looked at it and took action" (or "found nothing wrong"), in the 🔔. Never says *what* happened to the other person | People keep reporting only if reports visibly matter | S |
| **Owner dashboard** | For admins: requests per day, % that get an offer, time to first offer, deals, top categories and areas, reports waiting — as simple charts | You can't grow what you can't see; no outside analytics service needed | M |
| **Identity re-check after big changes** | Changing your name or account type asks for a new identity check; changing a shop's business number too | KYC stays true over time, not only on day one | S–M |

## 2. After you agree (the part between "Accept" and "Found it")
| Idea | What it looks like | Why it fits | Effort |
|---|---|---|---|
| **Pickup checklist per category** | After an accept, a short checklist to tick at pickup: phones (IMEI matches the box, battery health, Find My is off), cars and parts (part number, VIN), furniture (measure first). Private to you | Fewer bad surprises; feels like a friend helping | S |
| **Big-deal safety card** | For prices above BD 200 (or $500): "Meet at a bank or police station safe zone, check documents, pay in a traceable way" | Extra care only when it matters, so it isn't noise | S |
| **Hold it for me** | The seller taps "Hold for you until 6 pm"; the offer card shows ⏸ Held until 6 pm. No money involved | Common in real shops; makes plans clear | S |
| **Delivery add-on** ⚖️ | After an accept, the buyer can ask "Need it delivered?": a small linked request that verified drivers/finders can offer on (price, time). Still request-bound | Many buyers have no car or time; finders get more work | L |
| **Stolen-phone check** ⚖️ | Paste an IMEI to check it against a blocked-phones list (needs a provider or the telecom regulator) | A real local worry with second-hand phones | M |

## 3. Help sellers keep up
| Idea | What it looks like | Why it fits | Effort |
|---|---|---|---|
| **Away mode** | "On holiday until Sunday": alerts pause, your shop page and chats show "Away until Sunday", and reply-time badges don't count those days | Honest; protects good sellers' ratings and reply times | S |
| **"Usually in stock" list** | A shop lists what it usually has ("iPhone cases, chargers"). When a matching request is posted, the shop is told first, and the buyer sees "3 shops near you usually stock this" (no button to message them — they come to the request) | Brings shops to requests faster without breaking the MUST | M |
| **Finder's fee shown openly** | Finders (personal accounts who source items) can show "Includes my finder's fee of BD 5" on an offer | Honest pricing; finders are a real Bahrain role | S |
| **Seller tips from their own numbers** | "Your offers with a photo were accepted 2× more often" on the seller's home page | Coaching from real data, not ads | M |

## 4. Help buyers get there
| Idea | What it looks like | Why it fits | Effort |
|---|---|---|---|
| **Raise my budget** | On a quiet request: "Raise budget to BD 60?" One tap updates it and tells sellers who looked at or saved it | Turns "no offers" into offers, inside the request | S |
| **Paste a link** | Paste a link to the product you want (e.g. from an online shop): Unc fills the title and a picture. The link itself is shown as text, not clickable for sellers | Fast, exact requests. (Fetching links on the server needs care: only https, short timeout, no private addresses.) | M |
| **Same thing, again** | "Your last request for a water filter was 6 months ago — need a new one?" (only if you opt in on that request) | Refills and repeat services; one tap | S |

## 5. More of Bahrain
| Idea | What it looks like | Why it fits | Effort |
|---|---|---|---|
| **More languages** | Add Hindi, Urdu, Malayalam and Tagalog to Arabic and English (the same translation files) | About half of Bahrain's residents are expats; many shop and sell in these languages | M per language |
| **WhatsApp alerts** ⚖️ | Notifications (not messages) sent on WhatsApp: "New offer on your request — open Unc". Replying happens only in Unc | People in Bahrain live in WhatsApp; push is easy to miss. Needs the official WhatsApp Business API (paid) | M |
| **Friday and holiday awareness** | "Most shops are closed now — offers may come after 4 pm" on Fridays and public holidays, using shop hours | Sets the right expectation; less "nobody answers" frustration | S |

## 6. Quality of the app itself
| Idea | What it looks like | Why it fits | Effort |
|---|---|---|---|
| **Works offline (drafts)** *(on the roadmap)* | A request you write offline is kept and posted when you're back online | Phones lose signal; nobody loses a long description | M |
| **Backups you can see** | Admin page: last backup time and a "download backup" button (database + photos, without identity documents) | The owner can sleep at night; no command line needed | S–M |
| **Speed check page** | Admin: how fast the main pages answer today vs last week | Spots slowdowns early (the app already has performance tests) | S |

## Recommended next five (most value for the vision, least risk)
> ✅ All five were built in [[2026-10-22 Session 37]] → [[Your Data, Dashboard and Care]].
1. **Download my data / delete my account**: needed before a public launch (PDPL), and builds trust.
2. **Owner dashboard**: lets you see whether the marketplace works (time to first offer is the key number).
3. **Away mode**: protects good sellers and keeps reply times honest.
4. **Pickup checklist + big-deal safety card**: safety at the riskiest moment, with no outside service.
5. **Report follow-up + raise my budget**: two small, high-value touches (one for trust, one for getting offers).

Next after that: "usually in stock", more languages, hold it for me.

## Decisions only the owner can make (⚖️)
- **Deleting accounts:** how long to keep what the law requires (audit log, deal records), and whether the undo window is 7 or 30 days.
- **Delivery add-on:** is Unc ready for drivers as a seller type (they would need the same identity check)?
- **WhatsApp alerts:** the cost per message, and Meta's approval of the message templates.
- **Stolen-phone check:** which provider, or whether to ask the telecom regulator (TRA).
- **More languages:** which first, and who checks the translations (a native speaker, not only a machine).

## Never (breaks a MUST or trust)
- A "message this shop" button from the "usually in stock" list: the shop comes to the request, not the other way round.
- Sending chat text over WhatsApp, or letting people reply there.
- Telling a reporter what happened to the person they reported (only that the team acted).
- Keeping identity documents after an account is deleted.
