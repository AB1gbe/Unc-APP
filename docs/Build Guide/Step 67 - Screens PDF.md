---
tags: [build-guide, design, tooling]
step: 67
---
# Step 67: A PDF of every tab and page (session 76)

**Optional.** It only makes a picture book of the app (for a designer, an investor or a Figma brief, see [[Figma Design Prompt]]). It changes nothing in the app.

Script: `scripts/make-screens-pdf.mjs`. It signs in as a visitor, the demo buyer, the demo shop and the admin. It takes a computer screenshot (1280×800) and phone screenshots (390×844, scrolled top to bottom, up to 4) of each page, and writes `docs/Design/Unc screens.pdf`.

On Windows cmd, inside `C:\Users\a.baqer\Documents\Unc-APP`:
1. Fresh demo data: stop the server, `rmdir /s /q server\data`, `npm run seed`, `npm start`.
2. In a second cmd window, in the same folder: `node scripts/make-screens-pdf.mjs`
3. Open `docs\Design\Unc screens.pdf`.

To add a page: add a line `[name, path, note]` to the right `section(...)` list in the script. If you changed the admin password, first run `set ADMIN_PASSWORD=yourpassword` in the second window.
