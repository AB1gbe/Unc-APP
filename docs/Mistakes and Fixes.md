---
tags: [mistakes, log]
updated: 2026-10-21 (session 02)
---
# Mistakes and Fixes

Every mistake, wrong turn, or bug we hit — with the **symptom**, the **cause**, the **fix**, and the **lesson**. Newest at the bottom. Numbered `M1, M2, …` so other notes can link to them (e.g. `[[Mistakes and Fixes#M4]]`).

**Totals so far:** 16 entries — 5 tooling/setup, 6 app bugs caught before release, 3 dev-environment gotchas, 1 documentation gap found by the owner, 1 false alarm. All fixed.

| # | Area | One-liner | Session |
|---|---|---|---|
| M1 | Tooling | `&` in npm script isn't cross-platform | [[2026-10-21 Session 01]] |
| M2 | Tests | `node --test test/` crashed with MODULE_NOT_FOUND | 01 |
| M3 | Tests | Helper file was run as a test | 01 |
| M4 | Tooling | Vite 7 vs plugin-react 6 peer conflict | 01 |
| M5 | Tooling | `npm install` inside a workspace folder lost packages | 01 |
| M6 | Client | "time ago" helper divided by the wrong units | 01 |
| M7 | Client | Date-only strings became *Invalid Date* | 01 |
| M8 | Client | Duplicate chat messages in development | 01 |
| M9 | Security/CSP | Photo previews blocked by Content-Security-Policy | 01 |
| M10 | Design | Header button text unreadable (dark on blue) | 01 |
| M11 | Client | Unread badge stayed after reading | 01 |
| M12 | Dev env | `pkill -f` killed its own shell | 01 |
| M13 | Dev env | Same, because start + stop were in one command | 01 |
| M14 | Docs | Owner's first run on Windows failed: `ENOENT … package.json` | [[2026-10-21 Session 02]] |
| M15 | Dev env | Test SMTP catcher imported a package by a guessed internal path | 02 |
| M16 | False alarm | Garbled "â" in the reset email screenshot | 02 |

---

## M1
**Running two processes with `&` in an npm script**
- **Where:** root `package.json`, script `dev`.
- **What I did first:** `"dev": "npm run dev --workspace server & npm run dev --workspace client"`.
- **Problem:** `&` means "run in background" only in Mac/Linux shells. On Windows `cmd.exe`, npm scripts run through cmd where `&` means "run one *then* the other" — the server never stops, so the client never starts.
- **Caught:** in self-review before anyone ran it.
- **Fix:** installed `concurrently` (`npm install -D concurrently` at the root) and changed the script to:
  ```json
  "dev": "concurrently -n api,web -c blue,green \"npm:dev:server\" \"npm:dev:client\""
  ```
- **Lesson:** never use `&`, `&&` with env vars like `NODE_ENV=x cmd`, `rm -rf`, etc. in npm scripts if Windows users must run them. Use cross-platform tools or set things inside the JS code.

## M2
**`node --test test/` → `Error: Cannot find module '/…/server/test'`**
- **Where:** `server/package.json`, script `test`.
- **Symptom:** test run printed `MODULE_NOT_FOUND`, `not ok 1 - test`.
- **Cause:** Node 22's test runner treats a bare directory argument as a *file* to run, not a folder to search.
- **First fix:** use plain `node --test` (no argument), which auto-discovers tests → led to M3.

## M3
**Auto-discovery also ran `test/helpers.js` as a test**
- **Symptom:** output showed `ok 1 - test/helpers.js` and 22 tests instead of 21.
- **Cause:** Node's default pattern runs *every* `.js` file inside any folder named `test`.
- **Final fix:** explicit glob, quoted so Node (not the shell) expands it — works on Windows too:
  ```json
  "test": "node --disable-warning=ExperimentalWarning --test \"test/*.test.js\""
  ```
- **Lesson:** name tests `*.test.js` and point the runner at exactly that pattern.

## M4
**`npm error ERESOLVE … peer vite@"^8.0.0" from @vitejs/plugin-react@6.1.2`**
- **Where:** installing client dev dependencies.
- **What I did first:** `npm install -D vite@7 @vitejs/plugin-react` (pinned Vite 7 out of caution).
- **Cause:** the latest React plugin (6.x) only supports Vite 8. Pinning one package but not its partner creates a conflict.
- **Fix:** install matching majors: `vite@8` + `@vitejs/plugin-react@6`.
- **Lesson:** when pinning a tool, pin its plugins to a compatible major too. Check with `npm view @vitejs/plugin-react peerDependencies`.

## M5
**Packages "disappeared" after installing from inside `client/`**
- **Symptom:** `client/package.json` had no `react`; a stray `client/node_modules` with only `vite` appeared; npm warned *"Ignoring workspaces for specified package(s)"*.
- **Cause:** with npm workspaces, running `npm install <pkg>` *inside* a workspace folder behaves inconsistently.
- **Fix:** deleted `client/node_modules`, `client/package-lock.json`, `server/package-lock.json`, then installed **from the repo root** with the `--workspace` flag:
  ```bash
  npm install react@19 react-dom@19 react-router-dom@7 --workspace client
  npm install -D vite@8 @vitejs/plugin-react@6 --workspace client
  ```
- **Lesson:** in a workspaces repo, **always run npm from the root** and target a package with `--workspace <name>`. There should be exactly one `package-lock.json` (at the root).

## M6
**"time ago" helper converted units wrong**
- **Where:** `client/src/api.js`, function `ago()`.
- **Cause:** a clever loop over `[60,'min'],[24,'h'],…` divided minutes by 24 when it should have divided by 60 for hours. (Would have shown "2h ago" for something 48 minutes old.)
- **Caught:** self-review right after writing.
- **Fix:** replaced with plain `if` steps: seconds → minutes → hours → days → date.
- **Lesson:** prefer boring, obvious code over clever loops, especially for something you can't easily see is wrong.

## M7
**`toDate("2026-12-01")` → Invalid Date**
- **Where:** `client/src/api.js`, `toDate()`.
- **Cause:** the helper converts SQLite timestamps `"2026-10-21 06:07:31"` to ISO by replacing the space with `T` and appending `Z`. A date-only string has no space, so it became `"2026-12-01Z"` — not valid.
- **Fix:** if the string is exactly 10 characters, treat it as local midnight: `new Date(\`${s}T00:00:00\`)`.
- **Lesson:** test helpers with every input shape the DB can produce (timestamps **and** plain dates).

## M8
**Chat messages could show twice during development**
- **Where:** `client/src/pages/Conversation.jsx`.
- **Cause:** React `StrictMode` deliberately runs effects twice in development, so two "load messages after id 0" requests could overlap and both append the same messages.
- **Fix:** when adding new messages, skip ids already in the list (a `Set` of ids), and keep `lastId` as the max seen.
- **Lesson:** any "append what's new" polling must be idempotent (safe to run twice).

## M9
**Selfie/ID previews would be blocked by the browser**
- **Where:** `server/src/app.js` (Helmet setup) affecting `Verification.jsx`.
- **Cause:** Helmet's default Content-Security-Policy allows images only from `'self'` and `data:`. The KYC form previews files with `URL.createObjectURL()`, which produces `blob:` URLs.
- **Caught:** reviewing the security headers before the browser test.
- **Fix:**
  ```js
  contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'data:', 'blob:'] } }
  ```
- **Lesson:** whenever you add a security header, list the features that load resources (previews, maps, fonts) and allow exactly those.

## M10
**"+ Post a request" button text was dark on blue**
- **Where:** `client/src/styles.css`.
- **Found by:** looking at the Playwright screenshots (`attachments/08-request-owner-view.png`, before fix).
- **Cause:** CSS *specificity*: `.nav a` (class + element) beats `.btn` (class only), so the nav's grey text colour won.
- **Fix:** added `.nav a.btn, .nav a.btn:hover { background: var(--brand); color: var(--brand-ink); }`.
- **Lesson:** always look at real screenshots — automated tests passed while the UI was visibly wrong.

## M11
**Unread badge kept showing after you read the message**
- **Where:** `client/src/components/Layout.jsx` + `Conversation.jsx`.
- **Cause:** badge only refreshed every 15 s. Refreshing on page change wasn't enough either: the badge request can finish *before* the conversation request marks messages as read.
- **Fix:** the conversation page fires a browser event `unc:read` after it loads unread messages; the header listens and re-counts.
- **Lesson:** when two components depend on the order of two network calls, signal explicitly instead of hoping for timing.

## M12
**`pkill -f "src/index.js"` killed the shell running it (exit code 144)**
- **Context:** stopping the test server during development (not part of the app).
- **Cause:** `pkill -f` matches the *full command line* of every process — including the shell whose command text contained `src/index.js`.
- **Fix:** use a regex that doesn't match itself: `pkill -f "src/index[.]js"`.

## M13
**…and it happened again**
- **Cause:** that time the same shell command *also started* the server with the literal text `src/index.js`, so the pattern still matched the shell.
- **Fix:** run "stop server" as its own separate command.
- **Lesson:** stopping processes by name is fragile. Simplest for you: press **Ctrl + C** in the terminal running `npm run dev`.

## M14
**First run on Windows: `npm error enoent Could not read package.json: … C:\Users\a.baqer\package.json`**
- **Reported by:** the owner, with a screenshot, running `npm install && npm run seed && npm run dev` in a fresh Command Prompt.
- **Cause (two gaps in my instructions):**
  1. The command was run in the home folder `C:\Users\a.baqer`, not inside the project. npm looks for `package.json` in the *current* folder. My chat summary said "run this" without saying "first clone and `cd` into the project".
  2. The code lives on the branch `claude/vibrant-edison-r9o798`, not `main`. A plain `git clone` checks out `main`, which only has the one-line README — so even inside the folder it would have failed.
- **Fix:** [[Run the App Locally]] now has a Windows section with every command, including `git clone -b claude/vibrant-edison-r9o798 …` and `cd Unc-APP`, plus this error in the troubleshooting table. README updated the same way. (Once the branch is merged into `main`, the `-b …` part is no longer needed.)
- **Lesson:** instructions for a non-developer must start from "open a terminal" and say *which folder* and *which branch*. Never assume the reader is already inside the project.

## M15
**`ERR_MODULE_NOT_FOUND …/smtp-server/lib/smtp-server.js`** (test tooling only)
- **Context:** a throw-away script that runs a fake SMTP server so the app could send real emails during the browser test.
- **Cause:** I imported a guessed internal file path; that package actually ships its code in `dist/cjs/`.
- **Fix:** import by package name — `import { SMTPServer } from 'smtp-server'` — and let Node resolve it (the script had to sit inside the project so Node could find `node_modules`).
- **Lesson:** never import a package's internal files; use the package name.

## M16
**False alarm: "ignore this email â€" your password…" in the email screenshot**
- **Cause:** my quick test decoder turned each UTF-8 *byte* of "—" into a separate character. Real email apps decode it correctly — the email itself was fine.
- **Action anyway:** replaced the raw "—" in the HTML email with the entity `&mdash;`, which survives any charset handling.
- **Lesson:** when something looks broken, check whether the *viewer* is broken before changing the product — but if a cheap change makes it robust either way, do it.
