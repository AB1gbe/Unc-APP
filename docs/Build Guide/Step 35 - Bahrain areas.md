---
tags: [build-guide, bahrain]
step: 35
---
# Step 35: Bahrain areas (session 31)

**What/why:** [[Choosing, Alerts and Safety#3. Bahrain governorates and areas]], [[ADR-035 Bahrain areas]].

1. Create the shared folder:
   - `shared/package.json`: `{ "type": "module", "private": true }`;
   - `shared/areas.js` exports `GOVERNORATES`, `normalizeCity`, `governorateOf`, `governorateNamed`, `areasOf` and `placeName`. The spelling key ignores case, "al-", "city" and Arabic letter variants (أ/إ/آ → ا, ة → ه).
2. Server, which imports it as `../../../shared/areas.js`:
   - `normalizeCity()` on city in `routes/auth.js` (register, `PATCH /me`), `routes/listings.js` (`readListingBody`) and `routes/alerts.js`;
   - Browse `city=`: a governorate name searches `IN (its areas)`;
   - alerts match a governorate;
   - the feed's `near` includes the same governorate.
3. Client, which imports it as `../../../shared/areas.js`:
   - `components/CityField.jsx` (an input with a `<datalist>`; `governorates` adds the whole governorates), used in Register, NewListing, ProfileEditor, Browse and Alerts;
   - `Place` (the translated name), used on cards, the request page, profile, chat, Saved and Feed;
   - `currentLang()` added to `i18n.jsx`.
   - Vite allows importing from `shared/` because it is inside the workspace root.
4. `server/src/seed.js`: demo cities become Juffair, Seef and Riffa.
5. Test: `server/test/areas.test.js`.

Then check, inside `Unc-APP`:
```
npm test
npm run e2e
npm run e2e:ar
npm run seed
npm run e2e:devices
```
