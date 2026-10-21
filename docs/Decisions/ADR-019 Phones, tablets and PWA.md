---
tags: [decision, mobile, design]
status: accepted
date: 2026-10-21
---
# ADR-019 Phones, tablets and installable app (PWA)

Context: "make it optimized for the phones as well for all devices". See [[Phones and Devices]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Native app | React Native / Expo app; **responsive website + web-app manifest (PWA)** | PWA | One codebase; "Add to Home Screen" gives an app icon and full-screen window; no app-store review. Revisit for push notifications on iPhone or store presence. |
| Navigation on small screens | Hamburger menu; **bottom tab bar** (Home, Browse, + Post, Messages, Account) under 900 px | Tab bar | Main places one thumb-tap away, like native apps; nothing hidden behind a menu. |
| Breakpoint for the tab bar | 760 px (phones only); **900 px (phones + tablets)** | 900 | iPad portrait header wrapped to 3 lines at 760 ([[Mistakes and Fixes#M51]]). |
| Tap targets | Same as desktop; **44 px minimum on touch screens** (`@media (pointer: coarse)`) | 44 px | Apple/Google guideline; mouse users keep the compact look. |
| Chat height | `100vh`; **`100dvh`** | dvh | `100vh` is taller than the visible area when the phone's address bar shows. |
| Checking it | Manual looking; **`npm run e2e:devices`**: 5 sizes × 2 languages × every main page, fails on sideways scrolling or a tall header | Script | Repeatable without AI; catches regressions. |

## Revisit when
- iPhone web push becomes important → consider a native shell.
