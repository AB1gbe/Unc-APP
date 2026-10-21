---
tags: [feature, design]
---
# Design System

**Why:** MUST #2 "simple and understandable design". Options: [[ADR-009 Styling approach]].
**Where:** `client/src/styles.css` (everything), `client/src/components/ui.jsx`.

## Principles we followed
1. **One primary action per screen**, always the blue button (Post request / Send offer / Submit for verification).
2. **Plain words**: "Post a request", "Have this? Make an offer", "I found it — mark fulfilled". No jargon like "KYC" in the UI except in admin.
3. **Always tell people what's next**: `VerifyPrompt` explains exactly which step is missing and links to it; progress bar during onboarding.
4. **Context everywhere**: chats always show which request they're about.
5. **Mobile first-class**: everything collapses to one column under 700–800 px.
6. **Dark mode** automatically via `prefers-color-scheme`.

## Tokens (top of styles.css)
| Token | Light | Use |
|---|---|---|
| `--brand` | `#2f6fed` | Primary buttons, links |
| `--ok` | `#138a4b` | Prices, verified, "fulfilled" |
| `--warn` | `#a56300` | Pending states |
| `--bad` | `#c62828` | Errors, reject, ban |
| `--radius` | `12px` | Cards |
Change these to re-theme the app.

## Components
`.card`, `.btn` (`.secondary .danger .ok .sm .block`), `.badge` (`.ok .warn .bad .grey`), `.alert` (`.error .info .warn .ok`), `.grid`, `.two-col`, `.field`, `.field-row`, `.steps`, `.bubble`, `.inbox-item`.

## Screens
| Home (mobile) | Browse (desktop) | Post a request |
|---|---|---|
| ![[14-mobile-home.png]] | ![[09-browse.png]] | ![[07-new-request.png]] |
