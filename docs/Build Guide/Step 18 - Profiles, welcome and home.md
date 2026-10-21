---
tags: [build-guide, profiles]
step: 18
---
# Step 18 — Profiles, welcome step and member home (session 13)

**What/why:** [[Profiles and Onboarding]], [[ADR-018 Profiles and onboarding]].

## 1. Database: migration 6 (add it to the end of `MIGRATIONS` in `server/src/db.js`)
```sql
ALTER TABLE users ADD COLUMN avatar TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN interests TEXT NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN onboarded_at TEXT;
```

## 2. Server
- `server/src/lib/uploads.js`:
  - `AVATAR_DIR()` returns `uploads/avatars`;
  - `avatarUrl(file)` returns `/uploads/avatars/<file>` or `null`.
- `server/src/app.js`: serve `/uploads/avatars` as static files, the same way as `/uploads/listings`.
- `server/src/middleware/auth.js`:
  - `parseInterests(json)`;
  - `publicMe` adds `avatarUrl`, `bio`, `interests` and `onboarded`.
- `server/src/routes/auth.js`:
  - `PATCH /me` changes only the fields that are sent:
    - bio: at most 300 characters;
    - interests: up to 8 names from `CATEGORIES`.
  - `POST /avatar`: multer field `avatar`. Check the file with `saveFiles`, then delete the old file.
  - `DELETE /avatar`.
  - `POST /onboarded`.
- `server/src/routes/listings.js` `GET /for-you`, using this SQL:
  - `status='open'`;
  - not the member's own request;
  - `NOT EXISTS` a conversation in which this member is the vendor;
  - `category IN (interests)` when the member chose interests;
  - `ORDER BY (lower(city)=lower(my city)) DESC, created_at DESC LIMIT 6`.
- `server/src/routes/ratings.js` `GET /members/:id` adds `avatarUrl`, `bio`, `city`, `interests` and `openRequests` (up to 6).

## 3. Client
- `client/src/images.js`: `shrinkImage(file, maxSide = 1600, quality = .85)` (canvas → JPEG).
- `components/ui.jsx`: `Avatar({ name, src, size })` shows the photo, or the first letter of the name.
- `components/ProfileEditor.jsx`: photo upload/remove, name, city, bio with a counter, interest chips.
- `pages/Welcome.jsx` (route `/welcome`): "Save and continue" and "Skip for now" both call `POST /api/auth/onboarded`.
- `pages/VerifyEmail.jsx`: the destination is `user.onboarded ? '/verification' : '/welcome'`. Use it both in the redirect after the code and in the `<Navigate>` ([[Mistakes and Fixes#M48]]).
- `pages/Home.jsx`: greeting, `ProfileChecklist`, *Needs your attention*, *Your open requests*, *Requests you could help with*.
- `App.jsx`: `/` shows Home to members and Browse to visitors (`HomeOrBrowse`); add a `browse` route.
- `pages/Account.jsx` and `MemberProfile.jsx`: use `ProfileEditor` and show the new fields.
- `locales/ar.js`: Arabic for every new text. `npm test` fails if any are missing.

## 4. Check
```
npm test
```
Test files: `server/test/profiles.test.js` (5 tests) and `home.test.js` (2 tests). `e2e/smoke.mjs` uploads a "face" picture on the Welcome step.
