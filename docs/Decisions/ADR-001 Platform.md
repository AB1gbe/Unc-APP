---
tags: [decision]
status: accepted
date: 2026-10-21
---
# ADR-001 Platform: responsive web app first

## Context
The owner wants something "like Facebook Marketplace / Craigslist". Craigslist is web-first; Marketplace is mostly mobile. We need to ship a complete, testable product quickly and keep it replicable by one person.

## Options considered
| Option | Pros | Cons |
|---|---|---|
| Native iOS + Android (Swift/Kotlin) | Best mobile feel, camera access | Two codebases, app-store review, Mac needed for iOS. Too much for v1. |
| React Native / Expo | One codebase for phones | Still app-store review; KYC camera + uploads add native config; web version is second-class. |
| **Responsive web app** ✅ | Works on phone + desktop instantly, no store approval, easiest to replicate, file inputs open the phone camera (`capture="user"`) | No push notifications (yet), not in app stores |
| PWA (web app installable on phone) | Web + "install" icon | Can be added later on top of the web app — not exclusive |

## Decision
Responsive web app. Mobile layout verified at 390 px wide (iPhone size) — see `attachments/14-mobile-home.png`.

## Revisit when
Users ask for push notifications or an app-store presence → wrap as a PWA first, then consider Expo reusing the same API.
