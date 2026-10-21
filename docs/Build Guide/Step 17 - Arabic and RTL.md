---
tags: [build-guide, i18n, arabic]
step: 17
---
# Step 17 — Arabic and right-to-left (session 12)

Behaviour and rules: [[Arabic and RTL]]. Decisions: [[ADR-017 Arabic and RTL]].

1. **Core** — `client/src/i18n.jsx`: `t`, `tj`, `tn`, `getLang`, `locale()` (`ar-BH-u-nu-latn`), `LanguageProvider` (sets `<html lang dir>`, saves to `localStorage` key `unc.language`, `key={lang}`), `formatDate`, `formatDateTime`, `hasSavedChoice`. Wrap `<App/>` in `main.jsx`; `onChange` → `PUT /api/auth/language`.
2. **Helpers** — `api.js`: `Accept-Language` header on every call, `money()` with `currencyDisplay: 'code'` in Arabic, `ago()` with `Intl.RelativeTimeFormat`, translated offline error.
3. **CSS** — logical properties (`margin-inline-start`, `text-align: start`, `insetInlineEnd`), `.flip` for arrows, `.ltr` for emails/codes, LTR typing for email/password/number inputs, `.table-scroll`.
4. **Pages** — replace every visible string with `t()`/`tj()`/`tn()`; member text gets `dir="auto"` or `<bdi>`; values stored in English use maps in `kycReasons.js`.
5. **Arabic** — `client/src/locales/ar.js`. Run `npm test` and translate whatever `i18n-coverage.test.js` lists.
6. **Server** — `server/src/lib/i18n.js` (`langOf`, `translateMessage`, field labels, `AR` table, patterns); `errorHandler` translates `res.json` errors; rate-limit `handler`; migration 5 `users.language` (nullable); register stores `langOf(req)`; `PUT /api/auth/language`; `publicMe` includes `language`; `emails.js` takes `lang`.
7. **Check**
```
npm test          # 75 pass
npm run build
# fresh data folder, then in a second window:
npm run e2e       # English journey
npm run e2e:ar    # Arabic journey with RTL/overflow/English-leak checks
```
