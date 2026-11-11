---
tags: [build-guide, navigation]
step: 66
---
# Step 66: App-style side bar (session 72)

**What/why:** [[ADR-067 App-style side bar]].

1. `client/src/components/Icon.jsx`: more icons (home, search, grid, user, plus, admin, language, list, sidebar).
2. `client/src/components/SideNav.jsx` (new): logo + toggle, links (`NavLink` with icon + `.side-label`), Post/Sign up button, language button, your photo → Account (or Log in). The toggle sets the class `side-collapsed` on `<html>` and saves `open`/`closed` in `localStorage` key `unc.sidebar`.
3. `client/src/components/Layout.jsx`: renders `<SideNav unread bell />`; the old top bar is now a slim phone header (logo, bell `.top-bell`, Log in/Sign up for visitors, language). The tab bar shows for everyone (`TabBar loggedIn`).
4. `client/src/styles.css`, block "App-style navigation" and "Side bar open / collapsed":
   - from 900px: `.topbar` hidden, `.sidenav` fixed on the inline-start side, `--side-w: 248px` (76px when `html.side-collapsed`), page content shifted by `--side-w`;
   - under 900px: side bar hidden; header + bottom tab bar.
5. Arabic: "Open the menu", "Close the menu" in `client/src/locales/ar.js`.

Check: `npm test`, `npm run e2e`, `npm run e2e:ar`, `npm run seed` + `npm start` + `npm run e2e:devices`.
