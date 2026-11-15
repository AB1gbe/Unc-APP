---
tags: [decision]
date: 2026-11-15
status: accepted
---
# ADR-082 Phone code for casual sellers

## Context
- [[Honest Review 2 2026-11-15]]: requiring a hand-checked ID before posting means a person selling a used bike waits for the owner to check their ID. On OpenSooq or Facebook it takes a minute, so For sale would stay empty.
- The owner chose: "phone code for casual sellers".

## Options
| Option | For | Against |
|---|---|---|
| Keep the ID check for everyone | Highest trust | Kills casual supply; checking by hand doesn't scale |
| **Phone code for people selling their own things or asking for something; ID check for Housing, Jobs and businesses** | One-minute start; one account per number slows down repeat scammers; most scams (rent and jobs) still need ID | Lower trust for For sale; texts cost money |
| Email only | No friction | Throwaway emails are free, so scammers make endless accounts |

## Decision
- People (not businesses) can post **For sale** ads and **Wanted** requests after confirming a Bahrain mobile number (8 digits, starting with 3 or 6) with a 6-digit SMS code. Wanted is included because it is Unc's core and asking costs nobody anything.
- **Housing and Jobs** ads and **all business** posts still need the ID check (plus a card for businesses).
- **Making offers** on Wanted requests still needs the ID check.
- One account per number. At most 5 texts a day per member. 5 wrong tries lock a code. Codes last 10 minutes.
- Others see a blue **Phone-checked** badge and "Mobile number confirmed; no ID check". The number itself is never shown.
- The rule lives in one place, `shared/trust.js` `postNeeds()`, used by both the server and the posting form.
- A real site without an SMS provider turns phone codes off (503 `SMS_OFF`). People then use the ID check.

## Revisit when
- Scam reports on phone-checked For sale ads rise. Then consider an ID check above a price, or for a second ad.
- SMS costs become noticeable.
