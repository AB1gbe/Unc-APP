---
tags: [feature, design]
---
# Design System

**Why:** MUST #2 "simple and understandable design". Options: [[ADR-009 Styling approach]].
**Where:** `client/src/styles.css` (everything), `client/src/components/ui.jsx`.

## Principles we followed
1. **One primary action per screen**, always the coral button (blue before session 62) (Post request / Send offer / Submit for verification).
2. **Plain words**: "Post a request", "Have this? Make an offer", "I found it — mark fulfilled". No jargon like "KYC" in the UI except in admin.
3. **Always tell people what's next**: `VerifyPrompt` explains exactly which step is missing and links to it; progress bar during onboarding.
4. **Context everywhere**: chats always show which request they're about.
5. **Mobile first-class**: everything collapses to one column under 700–800 px.
6. **One dark look for everyone** since session 62 (before: light, with dark mode following the phone setting). See [[#The new look (session 62)]].

## Tokens (top of styles.css)
| Token | Value (session 62) | Use |
|---|---|---|
| `--bg` / `--surface` / `--surface-2` | `#0b0c0f` / `#15171c` / `#1d2027` | Page, cards, raised parts |
| `--text` / `--muted` / `--border` | `#f2f2f4` / `#9ba1ab` / `#262a32` | Text and lines |
| `--brand` / `--brand-ink` | `#ff7a4d` (coral) / `#1b0d06` | Primary buttons, links; dark text on coral for contrast |
| `--ok` | `#4fd18b` | Prices, verified, "fulfilled" |
| `--warn` | `#f2b34f` | Pending states |
| `--bad` | `#ff6b6b` | Errors, reject, ban |
| `--radius` | `18px` | Cards |
| `--font-display` | Fraunces (Noto Kufi Arabic in Arabic) | `h1`, `h2`, the logo |
Change these to re-theme the app.

## Components
`.card`, `.btn` (`.secondary .danger .ok .sm .block`), `.badge` (`.ok .warn .bad .grey`), `.alert` (`.error .info .warn .ok`), `.grid`, `.two-col`, `.field`, `.field-row`, `.steps`, `.bubble`, `.inbox-item`.

## Screens
| Home (mobile) | Browse (desktop) | Post a request |
|---|---|---|
| ![[14-mobile-home.png]] | ![[09-browse.png]] | ![[07-new-request.png]] |

## The new look (session 62)
**Why:** the owner: "it looks bland… just text is not gonna cut it", then, after a first pass with bright cartoon pictures, "now it looks too childish, I need something like Siin". Decision: [[ADR-060 A darker, grown-up look]].

- **Dark theme for everyone**, warm coral accent, big rounded cards (18 px).
- **Fonts, bundled with the app** (no calls to font sites): *Fraunces* (serif) for headings, *Inter* for text, *Noto Kufi Arabic* for Arabic. Imported in `client/src/main.jsx` from the `@fontsource-variable/*` packages.
- **Pictures:** one object on a deep, muted colour (like the owner's example of a single bowl on a brown tile). Drawn by `scripts/make-art.mjs` into `client/public/art/` (steps, 16 categories, Help topics). The demo photos (`scripts/make-demo-photos.mjs`) use the same tones.
- **Front page (visitors):** the banner shows the two newest real requests as cards (`HeroStack`), then **How Unc works** in three pictures, then **Browse by category** tiles (`client/src/components/Showcase.jsx`).
- **Request cards** always have a picture: without a photo they show their category's picture (`categoryArt()` in `client/src/art.js`).
- **Help page:** a banner, picture tiles for each topic, a picture on each section and on "Contact the Unc team".

![[new-look-home.png]]
![[new-look-help-ar-phone.png]]

**Real photos:** sample photos from photo sites can't be downloaded from Claude's work machine (the network blocks them). Real member photos replace the demo pictures once people use Unc. To change a picture, edit the list in the script and run `node scripts/make-art.mjs`.

