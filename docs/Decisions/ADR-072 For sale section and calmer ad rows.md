---
tags: [decision, product, design]
status: accepted
date: 2026-11-13
---
# ADR-072 For sale section and calmer ad rows

The owner: **"add a for sale section too"**, then, with a phone screenshot of the front page: **"the listings look too hectic, isn't there a better layout"**.

| Question | Options | Chosen | Why |
|---|---|---|---|
| For sale categories | New list; **the same 16 as Wanted** | Same 16 | A seller of a phone and a buyer looking for one meet in the same category. |
| For sale fields | Price range; **one asking price + New/Used (required)** | Price + condition | What buyers filter on first. |
| How to allow `forsale` in the database | Rebuild the listings table; edit the schema by hand; **swap the column** (add new column with the new rule, copy, drop old, rename) | Column swap (migration 43) | Rebuilding would cascade-delete chats and photos (foreign keys); editing the schema isn't allowed on Cloudflare. Dropping a column deletes no rows. Tested in Node and in Cloudflare's runtime. |
| Row layout | Keep Craigslist text lines; photo grid cards; **photo rows** (thumbnail + title + price + one grey line) | Photo rows | Calm and easy to scan on a phone, like Dubizzle/OLX lists. Title in plain white (2 lines max), price in coral, facts and time in one grey line, no per-row badges. |
| "Sample" badges | One per row; **one line above the list** | One line | The badges were most of the noise. |
| Phone front page | Category lists per section; **2×2 boxes, categories on each section's page** | Boxes | The category lists made the phone page very long. |

**Revisit when:** For sale gets busy (then add a photo-grid view toggle), or real ads replace the demo ones.
