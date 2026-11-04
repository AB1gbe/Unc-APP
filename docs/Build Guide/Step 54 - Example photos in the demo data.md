---
tags: [build-guide, photos]
step: 54
---
# Step 54: Example photos in the demo data (session 54)

**What/why:** [[Photos#Example photos in the demo data (session 54)]], [[ADR-054 Example photos in the demo data]].

1. `scripts/make-demo-photos.mjs`: a list of pictures (file, size, two background colours, and emoji with size, position and turn). A special `'TABLE'` entry draws a table with shapes, because no emoji looks like one ([[Mistakes and Fixes#M105]]). It renders each with Playwright's browser into `server/demo-photos/*.jpg`. Only needed to change the pictures:
   ```
   node scripts/make-demo-photos.mjs
   ```
2. `server/src/seed.js`:
   - `demoPhoto(dir, name)` reads a file from `server/demo-photos/` and saves it with `saveFiles()`;
   - `addDemoPhotos(db)` fills only what's missing: avatars, the shop cover, request photos, the two PS5 offer photos, the story photo;
   - `seedDemo` calls it and is now exported for the test.
3. Test: `server/test/demo-photos.test.js` (seeds twice; checks the counts, that request photos are public, and that offer photos are only for the buyer).

Check, inside `Unc-APP`:
```
npm test
npm run seed
npm start
npm run e2e:devices
```
Then open http://localhost:4000/browse: every demo request has a photo.
