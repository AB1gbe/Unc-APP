---
tags: [research, design]
date: 2026-11-17
---
# Colour Options (session 105)

After [[ADR-084 Sky blue, cloud white and scarlet]] went live, the owner said: "no the color doesnt work, give me different color options". Five options are drawn below on the real app (home, an ad, For sale), on a phone. The owner chose to keep **green "go" buttons** in all of them.

| | Main (logo, links) | Page | Dot / underline |
|---|---|---|---|
| A Navy & Gold | #0b2545 | #faf8f3 | #e0a526 |
| B Teal & Coral | #0f766e | #f7f4ee | #f26b5b |
| C Black & Electric Blue | tile #0a0a0a, links #2453ff | #ffffff | #2453ff |
| D Indigo & Peach | #4338ca | #f8f7fc | #ff8a5b |
| E Before (blue & yellow) | #1f5fd6 | #f5f6f8 | #ffc928 |

![[s105-colour-option-A.png]]
![[s105-colour-option-B.png]]
![[s105-colour-option-C.png]]
![[s105-colour-option-D.png]]
![[s105-colour-option-E.png]]

## How the pictures were made (no code change)
1. In the `Unc-APP` folder, start the app with demo data: `npm run seed`, then `npm start`.
2. Run the script saved as `docs/attachments/s105-colour-preview-script.cjs.txt` (rename it to `.cjs`) with Node:
   ```
   node colour-preview.cjs <output folder> <id of a For sale ad>
   ```
   It opens each page in a phone-sized browser and adds a small style that overrides the colour tokens (`--bg`, `--brand`, `--sky`, `--scarlet`…) and the logo's fill.
