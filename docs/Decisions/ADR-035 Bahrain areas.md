---
tags: [decision, bahrain]
status: accepted
date: 2026-10-22
---
# ADR-035 Bahrain governorates and areas

See [[Choosing, Alerts and Safety#3. Bahrain governorates and areas]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Strict list or free text | Only areas from a list (would break existing data, tests and non-Bahrain users); **free text, tidied when it matches a known area** | Tidied free text | Fixes typos without blocking anyone. |
| Where the list lives | Database table; separate copies on server and website; **one shared file, `shared/areas.js`** | Shared file | One source of truth, easy to edit, no admin screen needed yet. |
| Input | A long `<select>` with "Other"; **a text box with suggestions (`<datalist>`)** | Suggestions | Fast on phones, and still lets you type anything. |
| "Near you" | Same city text only; distance on a map; **same city or same governorate** | Governorate | Bahrain is small; the governorate is the natural "nearby". |
| Display | Always English; **the reader's language for known areas** | Translated | Arabic readers see Arabic place names. |
| Accuracy | — | **A starting list** | Some areas sit near governorate borders; correct the file as needed. |

## Revisit when
- Members need exact locations → add blocks/roads, or a map pin with privacy rounding.
