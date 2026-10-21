---
tags: [feature, i18n, arabic]
---
# Arabic and Right-to-Left

**Why this design:** [[ADR-017 Arabic and RTL]]. **Build steps:** [[Step 17 - Arabic and RTL]]. Asked in [[2026-10-21 Session 12]].

| Home | Request | Chat (phone) |
|---|---|---|
| ![[ar-browse.png]] | ![[ar-request-owner.png]] | ![[ar-rated-phone.png]] |

## What the member sees
- A language button in the header: **العربية** when in English, **English** when in Arabic.
- First visit: Arabic if the browser is set to Arabic, otherwise English. The choice is remembered on that device.
- The whole page mirrors (menus, chat bubbles, forms, arrows ← →).
- Server error messages ("Wrong email or password") and **emails** come in the member's language.
- Dates, "5 minutes ago" (قبل 5 دقائق) and plurals follow Arabic grammar. **Numbers stay in Western digits** (123), as on Bahraini price tags.
- Prices show as `USD 300` in Arabic (a loose "$" gets reordered by right-to-left text).
- Text that members write keeps its own direction: an English title on an Arabic page reads correctly, and vice versa.

## How it works (where)
| Piece | File |
|---|---|
| `t('English text')`, `tj()` (links inside a sentence), `tn()` (plurals), `LanguageProvider`, date helpers | `client/src/i18n.jsx` |
| All Arabic text (342 entries), keyed by the English | `client/src/locales/ar.js` |
| English-stored values shown translated (rejection reasons, statuses, ID types) | `client/src/kycReasons.js` |
| Right-to-left CSS rules | top of `client/src/styles.css` |
| Server messages + readable field names | `server/src/lib/i18n.js` (used by `errorHandler` in `lib/http.js`) |
| Bilingual emails | `server/src/lib/emails.js` |
| Member's language | `users.language` (migration 5), `PUT /api/auth/language` |

### The rules for anyone adding a screen
1. **Every visible word goes through `t()`** (or `tj()`/`tn()`). Never type English directly in JSX.
2. Add the Arabic to `client/src/locales/ar.js` under the exact English text.
3. Run `npm test`: `i18n-coverage.test.js` lists anything missing, placeholders that don't match (`{name}`), and duplicate keys.
4. Member-written text: put `dir="auto"` on its element, or wrap it in `<bdi>`. **Not on input boxes** ([[Mistakes and Fixes#M43]]).
5. Spacing: use `margin-inline-start/end`, `text-align: start`, never left/right. Arrows: `<span className="flip">←</span>`.
6. Values stored in English (statuses, categories) are translated when shown, e.g. `t(listing.category)`, `statusLabel(status)`.
7. Server: throw English messages as before; add the Arabic to `AR` in `server/src/lib/i18n.js`. `arabic.test.js` fails if one is missing.
8. Check visually: `npm run e2e:ar` (below).

### Plurals
Arabic has up to six forms. In `ar.js` a plural is an object:
```js
'{n} offers': { zero: 'لا عروض', one: 'عرض واحد', two: 'عرضان', few: '{n} عروض', many: '{n} عرضًا', other: '{n} عرض' },
```
`tn(count, '{n} offer', '{n} offers')` picks the right one using `Intl.PluralRules('ar')`.

### Language preference rules
- `users.language` is **NULL** until the person chooses (sign-up in a language, or pressing the button while logged in). NULL → English emails, and the website keeps the browser's language.
- On login: if this device has a saved choice, the server is updated to it. If not, the device takes the member's saved language.

## Tests
- `server/test/i18n-coverage.test.js`: every `t()`/`tj()`/`tn()` text in `client/src` plus all categories have Arabic with the same placeholders; no duplicate keys. Skips comments.
- `server/test/arabic.test.js` (8): Arabic errors; readable field names; upload/permission/JSON errors; every server message covered; sign-up in Arabic stores `ar` and sends Arabic, RTL email; switching language changes emails (`en`/`ar` only); forgot-password notice; NULL preference → English emails.
- `e2e/arabic.mjs` (`npm run e2e:ar`): the whole journey in an Arabic browser with Arabic content. **On every page** it fails if the page isn't right-to-left, if anything overflows sideways on desktop or a 390-px phone, or if any English word appears that isn't on the allowed list (USD, PDF, JPG, "English", "Unc"…). Screenshots are saved as `e2e/screenshots/ar-*.png`.
