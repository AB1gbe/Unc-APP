---
tags: [decision, profiles, onboarding]
status: accepted
date: 2026-10-21
---
# ADR-018 Profiles and onboarding

Context: the owner asked for "a whole user experience, not just buying and selling fast and getting out". People trust a face, a few words and a track record. See [[Profiles and Onboarding]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Profile photo source | Reuse the KYC selfie; **separate, optional photo the member uploads** | Separate | KYC photos are private by rule and never reused or shown. |
| Where profile data lives | New `profiles` table; **columns on `users`** (migration 6) | Columns | One-to-one data; no extra join on every query. |
| Interests | Free text tags; **pick from the existing categories (max 8), stored as JSON text** | Categories | Same list as requests, so "Requests you could help with" can match exactly; no spelling variants. |
| Onboarding | No onboarding; forced long wizard; **one short, skippable Profile step after email confirmation** (`/welcome`) | Short + skippable | Gets most people to add a photo without blocking anyone. `onboarded_at` records finished *or* skipped, so it is shown once. |
| What a profile shows | Everything incl. email/phone; **photo, name, bio, city, interests, rating, reviews, open requests — no contact details, no message button** | Limited | MUST: contact only about a specific request. City was added (session 13) because it helps local trust and is already on every request. |
| Home for members | Same Browse page for everyone; **a personal home** (needs attention, your requests, requests for you, saved) | Personal home | Gives a reason to come back; logged-out visitors still get Browse at `/`. |

## Revisit when
- Members ask to hide their city → add a privacy toggle.
- More than ~20 categories → let interests be searched instead of chips.
