---
tags: [feature, mobile, design]
---
# Phones, tablets and every screen size

**Why:** [[ADR-019 Phones, tablets and PWA]]. **Build steps:** [[Step 19 - Phones, tablets and app icons]].
**Where:** `client/src/styles.css` (section "Phones, tablets and touch screens (session 13)"), `client/src/components/TabBar.jsx`, `client/src/components/Layout.jsx` (`hide-phone`), `client/index.html` (viewport, theme colour, manifest), `client/public/manifest.webmanifest`, `client/public/icons/`, `scripts/make-icons.mjs`, `e2e/devices.mjs`.

| Phone (iPhone size) | Arabic on a phone |
|---|---|
| ![[s13-phone-home.png]] | ![[s13-ar-phone-notifications.png]] |

Tablet: ![[s13-ipad-home.png]]

## What changes by screen size
| Width | Layout |
|---|---|
| under 900 px (phones, tablets) | Bottom **tab bar**: Home · Browse · **+ Post** · Messages (count) · Account. Top bar keeps only logo, 🔔, language. |
| under 760 px (phones) | One column; search bar 2 columns; tighter padding; chat fills the screen (`100dvh`) |
| touch screens (`pointer: coarse`) | Every button, link and input at least 44 px tall |
| iPhone with a notch | `viewport-fit=cover` + `env(safe-area-inset-*)` padding so nothing hides under the notch or home bar |

## Install as an app
On a phone: open the site → browser menu → **Add to Home Screen**. It opens full-screen with the "unc" icon (`manifest.webmanifest`).

## Checking every size (optional, but do it after layout changes)
Inside `Unc-APP`, branch `claude/vibrant-edison-r9o798`, two command windows:
```
npm run seed
npm run build --workspace client
npm start
```
```
npm run e2e:devices
```
Prints `DEVICES OK (5 sizes × 2 languages × 9 pages)` or a list of problems; screenshots in `e2e/screenshots/device-*.png`.
