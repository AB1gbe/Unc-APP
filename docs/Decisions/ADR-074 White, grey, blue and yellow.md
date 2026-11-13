---
tags: [decision, design]
status: accepted
date: 2026-11-13
---
# ADR-074 White, grey, blue and yellow

The owner, after the light coral look went live: **"The orange colour is not nice. Try a mix of white being the dominant, yellow maybe providing an accent, blue as well, grey."**

| Role | Before (ADR-073) | Now |
|---|---|---|
| Page / cards | #f0f2f5 / #ffffff | **#f5f6f8 / #ffffff** (white dominant) |
| Inputs, chips, second surface | #e9ebee | **#eef0f3** (grey) |
| Text / details | #1c1e21 / #65676b | **#16181d / #6b7280** (grey details) |
| Buttons, links, active menu | coral #e8552a | **blue #1f5fd6**, soft blue #e8f0fd |
| Main actions (Sell, Post an ad, side-bar post/sign-up, centre tab), selected chip and tab, "Looking for" tag, logo dot | coral | **yellow #ffc928 with dark text #1a1a1a**, soft yellow #fff6d6 |

Yellow is never used for text on white (too hard to read): only as a background with dark text. Variables `--accent`, `--accent-ink`, `--accent-soft` and the class `.btn.accent` are new.

**Revisit when:** a logo or brand colours are designed.
