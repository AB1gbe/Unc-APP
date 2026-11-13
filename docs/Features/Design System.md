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

## Real photos (session 64)
The drawings were replaced with **real photos from Pexels** (free licence): the 11 demo photos, the 3 "How Unc works" pictures, the 16 category tiles and the 6 Help pictures. See [[ADR-061 Real photos from Pexels]], [[Photo Credits]] and [[Step 61 - Real photos from Pexels]].

![[photos-home.png]]

## Photo-first marketplace look (session 68)
The owner found the session-62 look "too AI". After researching real marketplaces ([[Marketplace Design Study]]): square photos, 2 px corners, no shadows or gradients, request cards that are just a photo and text, Archivo as the only font, white prices. Decision: [[ADR-062 Photo-first marketplace look]]; steps: [[Step 62 - Photo-first marketplace look]]. **Tokens now:** `--radius: 2px`, `--shadow: none`, font Archivo (Noto Kufi Arabic in Arabic).

![[marketplace-look-home.png]]

## Smaller corners and back-glow (session 68, final)
The square redesign above was **reverted** ([[ADR-062 Photo-first marketplace look]]). What stays: the session 62–64 look with **6 px corners** (8 px banner) and a **back-glow**: `.glow-wrap` holds a blurred copy of the photo (`img.glow`, blur 38 px, saturate 1.8, opacity .55, .85 on hover) behind the card. Used by `ListingCard` (`client/src/components/ui.jsx`), `HeroStack` and `HowItWorks` (`client/src/components/Showcase.jsx`). Decision: [[ADR-063 Smaller corners and back-glow]].

![[backglow-home.png]]

## Less AI-looking details (session 70)
The owner chose four giveaways to change ([[ADR-064 Less AI-looking details]]): emoji → line icons (`<Icon name="…" />`, Phosphor) and plain wording; plain, local wording and a slim How-it-works strip; fonts **Readex Pro** (headings) + **IBM Plex Sans / IBM Plex Sans Arabic** (text); white prices, plain uppercase category labels, fewer frames, straight banner cards. Glow is stronger and also on category tiles. Steps: [[Step 63 - Less AI-looking details]].

![[less-ai-home.png]]

## Shops first and the owner's font (session 72)
Front page: banner → **Verified shops** → **4 categories + All categories** → stories → activity → search → requests. New pages `/shops` and `/categories`, each with a search bar. Glow toned down. Font chosen by the owner from four samples: **Plus Jakarta Sans** (English) + **Almarai** (Arabic). See [[ADR-065 Shops first and fewer categories]].

![[shops-first-home.png]]

## Calm home page and tabs (session 72)
Tabs **Home · Requests · Shops · Categories** in the top bar, and on phones in the bottom tab bar (now for visitors too). The visitors' home is calm: banner, 4 shops, 4 categories, 3 newest requests. Requests tab = search + all requests + activity; Shops tab = shops + stories. See [[ADR-066 Calm home page and tabs]].

![[calm-home.png]]

## App-style side bar (session 72)
Computers: a side bar instead of a top bar, with a toggle that folds it into an icon rail (remembered). Phones: slim header + bottom tab bar. See [[ADR-067 App-style side bar]].

![[app-side-open.png]]

## Phones look like an app (session 74)
Search = field + small icon button (word "Search" only on computers); no auto-focus; phone category tiles show the name on the photo. See [[2026-11-11 Session 74]].

![[phone-categories-app.png]]
Phone tab bar (session 74): floating glass bar (blur, see-through, rounded), tabs spread evenly. Theme colour for the phone's bars: `#0b0c0f` (`client/index.html`, `client/public/manifest.webmanifest`).

![[phone-glass-tabbar.png]]

## Session 85: light colours
Since [[ADR-073 Marketplace layout and light colours]] the app is light: page `#f0f2f5`, cards `#ffffff`, second surface `#e9ebee`, text `#1c1e21`, muted `#65676b`, borders `#dadde1`, coral `#e8552a` with white text, soft coral `#fdebe4`. All in `:root` at the top of `client/src/styles.css`. Theme colour `#ffffff` (`index.html`, `manifest.webmanifest`).
