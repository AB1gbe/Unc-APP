---
tags: [decision, money]
status: accepted
date: 2026-11-12
---
# ADR-070 Bahraini Dinar only

The owner: **"change the prices to bahraini dinar"**.

| Question | Options | Chosen | Why |
|---|---|---|---|
| Which currencies | Keep USD/EUR/GBP/CAD/AUD + add BHD as default; **BHD only** | BHD only | Unc is for Bahrain. One currency means no picker on the request form and every price is comparable. |
| How prices look | Browser's own currency format ("BHD 120", "د.ب.‏ 120.000"); **our own: "BD 120" / "120 د.ب"** | Own format (`shared/money.js`) | What shops in Bahrain write. The browser's format shows 3 decimals on every price and differs between browsers. Whole dinars show no decimals; fils (e.g. 1.500) show 3. |
| Old prices in other currencies | Leave them; mark them; **convert with fixed rates** | Convert (migration 41) | Mixed currencies would break filters and "lowest offer". Rates (BHD per unit): USD 0.376, EUR 0.43, GBP 0.50, CAD 0.27, AUD 0.25. Budgets and offers of BD 50+ are rounded to BD 5; anything above 0 becomes at least BD 1. |
| Demo data | Rewrite every demo price by hand; **write in dollars, convert at the end of the seed** | Same conversion SQL (`TO_BHD_SQL`) | One piece of code, tested once; the demo stays realistic. |

The server refuses any other currency (`CURRENCIES = ['BHD']`, a 400 error). The database column still exists, so another currency can be added later without a migration.

**Revisit when:** Unc opens in another Gulf country (then add its currency to `CURRENCIES` and a picker back on the form).
