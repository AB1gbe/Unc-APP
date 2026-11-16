---
tags: [decision, design]
date: 2026-11-16
status: accepted
---
# ADR-084 Sky blue, cloud white and scarlet

## Context
- The owner shared a reference image (a tennis-club site) and asked for "this colorway": Sky Blue #2C99D6, Cloud White #F8FAFC, Scarlet Red #EB2F33.
- In the image the main buttons are red. In Unc, colours carry meaning ([[ADR-076 Colours that mean something]]): green = go, red = careful, blue = neutral.

![[s104-colorway-reference.jpg|300]]

## Options (asked the owner)
| Main buttons | Logo dot and tagline highlight |
|---|---|
| Red, like the image (red no longer only "careful") | Scarlet red |
| Sky blue (no green) | Keep yellow |
| **Keep green for "go"** (only blue and background change) | White |

## Decision
- **Kept green for "go" buttons.**
- **Scarlet for the logo dot and tagline underline.**
- In `client/src/styles.css` `:root`:
  - `--sky` #2c99d6 and `--scarlet` #eb2f33 are the exact colours. They are used for the logo tile, the tagline word (sky) with its underline (scarlet), the request-card stripe, and the saved/favourite hearts.
  - `--bg` is #f8fafc (Cloud White). Borders and the second surface colour are cool greys.
  - `--brand` is #1877af, a deeper sky blue for links and blue buttons. The exact #2C99D6 has only 3.2:1 contrast with white, below the 4.5:1 needed for small text.
  - `--warn` and `--bad` are #d6262a, a deeper scarlet for warning text (5:1 on white).
  - `--accent` = `--scarlet`.
- The logo is a sky-blue tile with a white "u" and a scarlet dot (`Logo.jsx`, `logo-mark.svg`). The app icons were regenerated with `node scripts/make-icons.mjs`.

## Revisit when
- A professional designer does a brand pass.
- The owner wants the exact #2C99D6 on buttons anyway (then use bigger, bolder button text).
