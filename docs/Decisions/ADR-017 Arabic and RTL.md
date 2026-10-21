---
tags: [decision, i18n, arabic]
status: accepted
date: 2026-10-21
---
# ADR-017 Arabic and right-to-left

| Question | Options | Chosen | Why |
|---|---|---|---|
| Library | react-i18next / i18next; FormatJS (react-intl); **small custom `t()`** | Custom (~100 lines, `client/src/i18n.jsx`) | Two languages only; nothing to learn or install; easy to read and replicate. Revisit at 3+ languages. |
| Keys | IDs (`listing.offer.title`); **the English text itself** | English text | Code stays readable, English is the automatic fallback, and a test catches missing Arabic. Cost: changing English wording means updating the key in `ar.js` (the test points it out). |
| Sentences with links | Glue translated pieces together; **placeholders that can hold elements (`tj`)** | `tj` | Arabic word order differs; gluing pieces produces broken Arabic. |
| Plurals | "(s)" style; **`Intl.PluralRules`** | Intl | Arabic has 6 plural forms; the browser already knows the rules. |
| Digits | Arabic-Indic (١٢٣); **Western (123)** | Western | What Bahraini apps, price tags and receipts use; matches what people type. (`ar-BH-u-nu-latn`) |
| Switching | Every component subscribes to a context; **re-create the page (`key={lang}`)** | Re-create | One line, no missed component. Cost: a half-filled form resets — switching is rare. |
| Layout | Separate RTL stylesheet; **`<html dir="rtl">` + logical CSS properties** | dir + logical | Browsers mirror flex and logical spacing automatically; one stylesheet. |
| Member text | Force page direction; **`dir="auto"` / `<bdi>`** | auto | Mixed English/Arabic content must keep its own direction. |
| Server errors | Client maps error codes; **server translates by `Accept-Language`** | Server | Routes stay unchanged (English); one translation table; also covers rate-limit and upload errors. |
| Emails | English only; **member's stored language** | Stored | Emails arrive when the website isn't open. |

## Revisit when
- A third language: move to i18next (the `t('English')` calls convert mechanically).
- Professional translation: give `client/src/locales/ar.js` and the `AR` table in `server/src/lib/i18n.js` to a translator. They're plain lists.
