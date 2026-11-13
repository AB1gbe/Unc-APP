---
tags: [decision, design]
status: accepted
date: 2026-11-13
---
# ADR-073 Marketplace layout and light colours

The owner: **"For the design take inspiration from Facebook Marketplace as it's the leading marketplace in the US"**, then **"The colours are very dull"** (answered: "Light, like FB Marketplace").

| Question | Options | Chosen | Why |
|---|---|---|---|
| How ads are shown | Rows (session 84); **photo grid** | Grid for For sale, Housing and Wanted; rows for Jobs | Marketplace's core: big square photo, price first, title, area. Jobs rarely have photos. |
| Home page | Section boxes + lists; **"Marketplace": search, section chips, "Today's picks" grid** | Marketplace | Same order as Facebook Marketplace; Jobs as rows and Wanted ("What Bahrain is looking for") follow, keeping Unc's own idea visible. |
| Housing photos | Icons; **real photos (Pexels)** | Photos | A photo grid needs photos. 6 fetched with `ONLY=home- node scripts/fetch-photos.mjs`, ids fixed. |
| Ad page | **Big photo on top**, "Listed … in …", message ready to send ("Hi, is this still available?") | As Facebook Marketplace | One tap to ask. |
| Colours | Keep dark; brighter dark; **light like FB Marketplace**; follow the phone | Light (owner's choice) | Photos stand out on white. Page #f0f2f5, cards white, text #1c1e21, coral #e8552a with white text. Replaces ADR-060's dark look. |

Not copied: Facebook's name, logo, blue colour or exact styling; only the layout ideas. **Revisit when:** the owner wants a dark mode back (then "follow the phone").
