---
tags: [mistakes, log]
updated: 2026-10-21 (session 05)
---
# Mistakes and Fixes

Every mistake, wrong turn, or bug we hit — with the **symptom**, the **cause**, the **fix**, and the **lesson**. Newest at the bottom. Numbered `M1, M2, …` so other notes can link to them (e.g. `[[Mistakes and Fixes#M4]]`).

**Totals so far:** 35 entries = 5 tooling/setup (M1–M5) + 6 app bugs caught before release (M6–M11) + 5 dev-environment gotchas (M12, M13, M15, M17, M18) + 1 documentation gap found by the owner (M14) + 1 false alarm (M16) + 2 performance problems found by measuring (M19, M20) + 2 self-review catches (M21, M22) + 1 test that couldn't fail (M23) + 12 entries for the 15 bugs found by the session-05 code review (M24–M35). All fixed.

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
| M17 | Dev env | `pkill -f "PORT=4300"` killed its own shell (3rd time) | [[2026-10-21 Session 05]] |
| M18 | Dev env | Benchmark script assumed user 1 had conversations | 05 |
| M19 | Performance | Unread counter read every message on every poll (25 ms) | 05 |
| M20 | Performance | App JS sent uncompressed and never cached | 05 |
| M21 | Self-review | Loading fallback would have hidden the header | 05 |
| M22 | Self-review | Clearing poll errors would also have hidden send errors | 05 |
| M23 | Test | Parallel-upload test didn't reproduce the race at first | 05 |
| M24 | Review bug | Rate limit shared by all users behind a proxy | 05 |
| M25 | Review bug | Parallel KYC uploads → several pending submissions | 05 |
| M26 | Review bug | Banned buyer's requests/chats still usable | 05 |
| M27 | Review bug | Bad photo left a half-created listing | 05 |
| M28 | Review bug | Upload/JSON mistakes returned 500 | 05 |
| M29 | Review bug | Enter pressed twice sent a message twice | 05 |
| M30 | Review bug | Simultaneous sign-ups with one email → 500 | 05 |
| M31 | Review bug | Reset link usable twice if clicked at the same moment | 05 |
| M32 | Review bug | `banned: "false"` banned the user | 05 |
| M33 | Review bug | Orphaned ID photos after a failed KYC upload | 05 |
| M34 | Review bug | Huge page number → 500; impossible dates accepted; blank Verification page on error | 05 |
| M35 | Review bug | Vendor couldn't open a closed request they had talked about; one failed poll left a permanent error | 05 |

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

## M17
**`pkill -f "PORT=4300"` killed its own shell (exit 144) — third time**
- **Cause:** same as [[Mistakes and Fixes#M12]]/[[Mistakes and Fixes#M13]]: the pattern text was in the shell's own command line, and I ran two `pkill`s in one command so the first killed the shell before the second ran.
- **Fix:** run only the self-safe pattern, alone: `pkill -f "node --disable-warning=ExperimentalWarning src/index[.]js"`.
- **Lesson:** written as a rule now — *one stop command per shell call, always with a `[.]` style pattern*. For you on Windows: just press Ctrl + C.

## M18
**Benchmark crashed: `Cannot read properties of undefined (reading 'id')`**
- **Cause:** the throw-away benchmark assumed user #1 had conversations; with the generated data they didn't.
- **Fix:** pick the busiest user from the data (`GROUP BY … ORDER BY COUNT(*) DESC LIMIT 1`).
- **Lesson:** benchmarks/tests should ask the data, not assume it.

## M19
**The unread-message counter read all 200,000 messages on every call (25 ms)**
- **Found by:** measuring with 5,000 users / 30,000 requests / 20,000 conversations / 200,000 messages.
- **Why it mattered:** every logged-in browser calls it every 15 s — it is the most frequent query in the app.
- **Cause:** `WHERE (c.buyer_id = ? OR c.vendor_id = ?)` with **no index** on `buyer_id`/`vendor_id`. SQLite can't use indexes well across an `OR`, so it scanned everything. Inbox and "My requests" had the same missing-index problem.
- **Fix:** migration 3 (indexes) + rewriting the `OR` as `IN (… WHERE buyer_id = ? UNION ALL … WHERE vendor_id = ?)`, plus a *partial* index containing only unread messages. **25 ms → 1 ms.** Details: [[ADR-013 Performance]].
- **Lesson:** add an index for every column you filter or join on, and check with `EXPLAIN QUERY PLAN` — `SCAN` on a big table is the warning sign.

## M20
**316 KB of JavaScript sent uncompressed, with `Cache-Control: max-age=0`**
- **Cause:** no compression middleware; default static-file settings.
- **Fix:** `compression` package; build files (which have a hash in their name) cached for a year; `index.html` set to `no-cache`; pages split so most code loads only when needed. First visit 316 KB → **71 KB** transferred; repeat visits download nothing.

## M21
**Self-review: the page-loading fallback would have hidden the header**
- I first wrapped all routes in `<Suspense>`; while a page file downloads, everything inside — including the top bar — is replaced by "Loading…". Moved `<Suspense>` inside `Layout.jsx` around `<Outlet/>` only.

## M22
**Self-review: auto-clearing chat errors would have hidden send errors**
- To fix "one failed poll leaves a permanent error" I first cleared `error` on every successful poll — that would also erase "this request is closed" 4 s after you tried to send. Split into `error` (sending) and `pollError` (loading).

## M23
**The parallel-KYC test passed even on the old, buggy code**
- **Cause:** with tiny test images each upload finished before the next started, so the race never happened.
- **Fix:** 3 MB test images, so the three uploads really overlap. Verified: test **fails** on the old code, **passes** on the new.
- **Lesson:** for every bug fix, run the new test against the old code (`git stash push -- server/src`, run, `git stash pop`). A test that can't fail proves nothing.

## M24 – M35: bugs found by the code review (session 05)
An independent review read every file and reproduced each problem. All fixed; each has a test in `server/test/review-fixes.test.js` that fails on the old code (12 of 13 confirmed directly; M25 after [[Mistakes and Fixes#M23]]).

| # | Symptom | Cause | Fix (file) |
|---|---|---|---|
| M24 | On a host like Render, all visitors would share one 20-attempt limit → everyone locked out | No `trust proxy`, so every request seemed to come from the proxy's IP; one limiter shared by all auth actions | `TRUST_PROXY` setting (`config.js`, `app.js`); separate limit per action (`routes/auth.js`) → [[ADR-014 Rate limiting]] |
| M25 | Uploading KYC from two tabs created 2–3 pending submissions; deciding a stale one overrode an approval | "Already pending?" check used user data read *before* the slow upload finished | Atomic `UPDATE … WHERE kyc_status IN ('unverified','rejected')` inside the transaction; `applyDecision` only changes the user's status for their **newest** submission (`routes/kyc.js`, `kyc/index.js`) |
| M26 | After banning a buyer, their request still opened by link and vendors could start/continue chats | Ban only checked the logged-in user | Banned buyer's requests → 404 (admins excepted); contact → 404; messages to a suspended member → 409 (`routes/listings.js`, `routes/conversations.js`) |
| M27 | Good photo + bad photo → error shown, but the listing was created anyway (retry = duplicate) | Rows inserted before all photos were checked, no transaction | `saveFiles()` checks all files first; listing + photos in one `tx()`; files deleted on failure (`lib/uploads.js`, `routes/listings.js`) |
| M28 | 4 photos, unknown file field, broken JSON → "Something went wrong on our side" (500) | Error handler only knew "file too large" | Map all upload errors to 400/413 and body-parser errors to 400 (`lib/http.js`) |
| M29 | Pressing Enter twice quickly sent the message twice | Button disabled while sending, keyboard shortcut not | `if (sending) return` (`Conversation.jsx`) |
| M30 | Two sign-ups with the same email at the same moment → 500 | Check-then-insert race | Catch the UNIQUE error → 409 (`routes/auth.js`) |
| M31 | A reset link clicked twice at once worked twice | Check and use were separate steps with a slow hash in between | Atomic "claim" `UPDATE … WHERE used_at IS NULL` inside the transaction; also re-checks ban (`routes/auth.js`) |
| M32 | Unban sent as text `"false"` banned the user | `Boolean("false")` is `true` in JavaScript | Accept only real `true`/`false`, else 400 (`routes/admin.js`) |
| M33 | Valid ID front + invalid selfie → 400, but the ID photo stayed on disk with no record | Files written one by one before validation finished | `saveFiles()` validates all first; deletes on failure (`routes/kyc.js`) |
| M34 | `?page=999999999999999999999` → 500; `2026-02-31` accepted (shown as 3 March); Verification page went blank if loading failed | No upper bound; `Date.parse` rolls impossible dates over; error state not rendered | Page capped at 10,000; date round-trip check (`lib/validate.js`); error + "Try again" (`Verification.jsx`) |
| M35 | Vendor's "About: request" link → "no longer open" after the buyer closed it; one network blip left a red error forever | Closed requests visible to owner/admin only; poll error never cleared | Vendors with a conversation may view it; poll errors clear on next success (`routes/listings.js`, `Conversation.jsx`) |
