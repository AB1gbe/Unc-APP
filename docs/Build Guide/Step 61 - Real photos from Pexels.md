---
tags: [build-guide, photos]
step: 61
---
# Step 61: Real photos from Pexels (session 64)

**Optional:** the photos are already committed. Do this only to change them. **Why it matters:** real photos make Unc look trustworthy instead of like a toy ([[ADR-061 Real photos from Pexels]]).

1. Get a free key: pexels.com/api → sign up → **Your API key**.
2. Open Windows cmd inside `C:\Users\a.baqer\Documents\Unc-APP`, on branch `claude/vibrant-edison-r9o798`:
   ```
   set PEXELS_API_KEY=your-key
   node scripts/fetch-photos.mjs
   ```
3. To change one picture: in `scripts/fetch-photos.mjs`, change its search words and set its id to `null`, then run again. Write the new id (printed after `←`) back into the list.
4. Rebuild so the app shows them: `npm run build`. For the demo data: a fresh database, then `npm run seed`.
5. Check: `npm test`, `npm run e2e`, `npm run e2e:ar`, `npm run seed` + `npm run e2e:devices`.

Files: `scripts/fetch-photos.mjs`, `client/public/art/*.jpg` + `credits.json`, `server/demo-photos/*.jpg` + `credits.json`. The old drawing scripts (`scripts/make-art.mjs`, `scripts/make-demo-photos.mjs`) would draw over the photos; only run them to go back to drawings.
