---
tags: [research, design]
date: 2026-11-11
---
# Marketplace Design Study (session 68)

**The question:** "I like how it looks but it feels too AI. Research similar websites and copy their design philosophies. E.g. we have all rounded images, a sign of AI; we don't want that."

## What makes a site look AI-made (sources below)
- **Everything in rounded cards** with the same corners; three rounded cards in a row.
- **Purple/blue gradients** and soft, generic **drop shadows**.
- **Inter** for everything, or a trendy serif + Inter pairing.
- **Template layout:** centred banner, icon-over-heading feature rows.
- **Emoji or icons as decoration**, vague copy.
- Test: could you swap in another company's logo and nothing would feel wrong?

## What real marketplaces do
| Site | Philosophy we took |
|---|---|
| **Grailed** | Restrained, monochrome, blog-like; a plain grotesk font; the photos carry the design |
| **Depop** | Square photos in a grid like a social feed; little chrome |
| **Vinted** | Photo first; small dots show how many photos; text under the photo |
| **Poshmark** (2025 redesign) | White space and large images |
| **Airbnb** | The first photo matters most; the photo fills the top of the card, a few lines of text below |
| **eBay** | Row after row of identical square tiles; one accent colour for the main action |

## What we changed in Unc (→ [[ADR-062 Photo-first marketplace look]])
1. **Square photos with no rounding**, and square-ish (2px) buttons and boxes. Only profile pictures stay round, as on every real app.
2. **No box around a request:** photo, then price, title, and "category · area · time" in small grey text.
3. **No shadows, no gradients.** The banner is plain text next to a straight grid of the newest real request photos.
4. **One font:** Archivo (a grotesk with a wide, heavy cut for headings), instead of Fraunces + Inter.
5. **Small uppercase section labels** ("HOW UNC WORKS"), like fashion marketplaces.
6. **Prices in white**, not green; coral only for actions (buttons, links, "2 offers").
7. **Fewer emoji:** "Juffair · 2 days ago" instead of 📍 🕒.

## Still to do (later)
- The "Happening on Unc" list and some pages (Account, Help answers) still use boxes and emoji.
- Swipeable photos with dots on request cards (Vinted/Airbnb).

## Sources (searched 2026-11-11)
- [Depop vs Grailed vs Poshmark (Desirability Lab)](https://desirabilitylab.com/backfill/backfill-2024-21-depop-vs-grailed-vs-poshmark) · [Depop's visual marketplace](https://desirabilitylab.com/backfill/backfill-2022-89-depops-visual-marketplace) · [Design critique: Vinted (Pratt)](https://ixd.prattsi.org/2026/09/design-critique-vinted-mobile-app/) · [Design critique: Depop (Pratt)](https://ixd.prattsi.org/2019/02/design-critique-depop-ios-app/) · [Poshmark redesign (Fast Company)](https://www.fastcompany.com/91515118/poshmark-app-redesigned-after-15-years) · [eBay design notes (shadcn.io)](https://www.shadcn.io/design/ebay/raw)
- [Airbnb: trust at scale through design](https://blakecrosley.com/guides/design/airbnb) · [Photo quality and marketplace sales](https://letsenhance.io/blog/all/photo-quality-marketplace-statistics/amp/)
- AI look: [Why AI design looks generic (SuperDesign)](https://www.superdesign.dev/blog/why-ai-design-looks-generic) · [AI slop design tells (925 Studios)](https://www.925studios.co/blog/ai-slop-design-tells) · [7 common AI website mistakes (SEJ)](https://searchenginejournal.com/7-common-ai-website-mistakes-that-are-easy-to-avoid/574196/) · [Anti-patterns (Impeccable)](https://www.mintlify.com/pbakaus/impeccable/concepts/anti-patterns) · [AI design slop (Noqta)](https://noqta.tn/en/blog/ai-design-slop-overused-ui-patterns-fix-2026)

![[marketplace-look-home.png]]
