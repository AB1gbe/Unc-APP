---
tags: [decision, design, brand]
status: accepted
date: 2026-11-13
---
# ADR-075 Logo

The owner: **"The logo needs changing, it looks really bad, generate something good."** The old logo was just the text "unc" with a coloured "c".

Four options were drawn as vector graphics (SVG) in the app's colours, not AI images, because image generators draw letters and small icons badly:

![[logo-options-session-85.png]]

| Option | Idea | Chosen |
|---|---|---|
| A | Yellow price tag with a blue "u" ("for sale") | |
| **B** | **Blue rounded tile, white "u", yellow dot (app icon)** | **✅ owner's choice** |
| C | Blue map pin with a yellow "u" ("local") | |
| D | Blue and yellow chat bubbles ("buyer and seller talk") | |

Why B: the cleanest as a phone icon and at tiny sizes (browser tab).

## Where it lives
- `client/public/icons/logo-mark.svg`: the tile. It is also the browser-tab icon.
- `client/src/components/Logo.jsx`: `LogoMark` plus the word "unc", used in `Layout.jsx` (phone header) and `SideNav.jsx` (only the tile when the side bar is folded).
- `scripts/make-icons.mjs` turns the SVG into `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (a full blue square, because the iPhone rounds the corners itself) and `icon-512-maskable.png` (the mark smaller, so Android can crop it to a circle). Run `node scripts/make-icons.mjs` after changing the SVG.
- Emails (`server/src/lib/emails.js`): a blue square with "u", then "unc" (emails can't show SVG reliably); email buttons are now blue #1f5fd6.

**Revisit when:** a designer makes a full brand identity.
