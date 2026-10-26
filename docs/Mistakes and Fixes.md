---
tags: [mistakes, log]
updated: 2026-10-26 (session 53)
---
# Mistakes and Fixes

Every mistake, wrong turn, or bug we hit — with the **symptom**, the **cause**, the **fix**, and the **lesson**. Newest at the bottom. Numbered `M1, M2, …` so other notes can link to them (e.g. `[[Mistakes and Fixes#M4]]`).

**Totals so far:** 104 entries = 5 tooling/setup (M1–M5) + 6 app bugs caught before release (M6–M11) + 5 dev-environment gotchas (M12, M13, M15, M17, M18) + 1 documentation gap found by the owner (M14) + 1 false alarm (M16) + 2 performance problems found by measuring (M19, M20) + 2 self-review catches (M21, M22) + 1 test that couldn't fail (M23) + 12 entries for the 15 bugs found by the session-05 code review (M24–M35) + 2 in session 09 (M36 test-setup slip, M37 brittle test) + 2 in session 10 caught by testing the push/pull helper (M38, M39) + 8 in session 12 (Arabic): 1 script slip, 1 repeat of the pkill trap, 5 caught by screenshots or the Arabic browser test, 1 brittle test (M40–M47) + 7 in session 13 (profiles, phones, photos): 2 caught by screenshots, 1 by the all-devices test, 1 race between two redirects, 1 replicability slip, 1 server bug caught by a new test, 1 outdated test (M48–M54) + 1 process slip in session 14 (M55) + 4 in session 15: 1 missed session-13 slip, 2 test-browser limits, 1 self-caught UX bug (M56–M59) + 4 in session 17: 1 bug found by the browser test, 1 found by looking at the rendered email, 1 test-run slip, 1 test that needed updating (M60–M63) + 1 wrong number in a summary, session 18 (M64) + 7 in session 20: 2 translation-tooling slips, 1 self-review catch, 2 found by screenshots, 1 test-checker limit, 1 repeat of the reused-database slip (M65–M71) + 1 self-review catch in session 22 (M72) + 3 in session 24: 2 test-helper slips, 1 phone layout found by screenshot (M73–M75) + 1 self-review catch in session 26 (M76) + 1 browser-test slip in session 28 (M77) + 4 in session 31: 1 repeat of short test data, 1 self-review catch, 2 found by screenshots (M78–M81) + 6 in session 34: 2 wrong test expectations, 2 Arabic-file slips caught by the coverage test, 1 browser-test data slip, 1 docs-script slip (M82–M87) + 7 in session 37: 2 test slips, 1 browser-test selector, 3 found by screenshots or the Arabic layout check, 1 missing translation (M88–M94) + 6 in session 40: 1 caught by trying examples, 1 Arabic layout check, 1 test that needed updating, 3 self-review catches (M95–M100) + 1 instruction slip in session 42 (M101) + 1 in session 48 (M102) + 1 start-up bug found by the owner in session 49 (M103) + 1 instruction slip in session 53 (M104). All fixed.

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
| M36 | Dev env | Test setup for live sync left a stray "tmp" commit locally | [[2026-10-21 Session 09]] |
| M37 | Test | A test hard-coded the database version, so adding migration 4 broke it | 09 |
| M38 | Script | `push` showed `ocs/Roadmap.md` instead of `docs/Roadmap.md` | [[2026-10-21 Session 10]] |
| M39 | Script | `push` froze at its second question | 10 |
| M40 | Script | Translation helper wrote `../i18n.jsx` instead of `../../` for admin pages → build failed | [[2026-10-21 Session 12]] |
| M41 | Dev env | `pkill` in the same command as starting the server — repeat of M13 | 12 |
| M42 | Arabic | Admin's default language "English" switched an Arabic browser to English | 12 |
| M43 | Arabic | Empty chat box showed its hint text with quote marks out of place | 12 |
| M44 | Arabic | Curly quotes around comments came out reversed | 12 |
| M45 | Arabic | Prices showed as "$US 300" | 12 |
| M46 | Arabic | English titles on Arabic pages had punctuation thrown to the wrong end | 12 |
| M47 | Test | A test looked for exactly `<html>`; emails now start `<html lang=…>` | 12 |
| M48 | Client | After confirming email, the welcome step was skipped | [[2026-10-21 Session 13]] |
| M49 | Test data | Profile photos looked blank in screenshots | 13 |
| M50 | Replicability | Icon generator deleted right after use | 13 |
| M51 | Design | iPad header wrapped to 3 lines (115 px tall) | 13 |
| M52 | Server | A missing public photo returned 500 instead of 404 | 13 |
| M53 | Test | Old test still expected the 3-photo limit | 13 |
| M54 | Design | Chat **Send** button squeezed to "Sen / d" after adding 📷 | 13 |
| M55 | Process | Session note written after the merge, so it missed `main` | [[2026-10-21 Session 14]] |
| M56 | Test | New test used the title "Mine", which is too short → 400 (session 13, logged late) | [[2026-10-21 Session 15]] |
| M57 | Dev env | Headless Chromium reports notifications as "blocked" no matter what | 15 |
| M58 | Dev env | Push refused in a private/incognito browser profile | 15 |
| M59 | Client | Stuck "Turn on" button and an English-only error when subscribing failed | 15 |
| M60 | Client | Email tick box jumped back when clicked, until the server answered | [[2026-10-21 Session 17]] |
| M61 | Email | English message shown backwards in the Arabic email | 17 |
| M62 | Dev env | Re-ran the browser test on the same database → sign-up failed | 17 |
| M63 | Test | Tests broke on invisible direction marks; the "fails on old code" check stashed too much | 17 |
| M64 | Reporting | Told the owner "105 tests pass"; it was 101 | [[2026-10-21 Session 18]] |
| M65 | Script | Rename helper changed a page but stopped before its Arabic key (unquoted `fulfilled:`) | [[2026-10-21 Session 20]] |
| M66 | i18n | Greeting texts built from a lookup were invisible to the translation test | 20 |
| M67 | Self-review | The new message bubble could have blocked taps on buttons under it | 20 |
| M68 | Client | A buyer saw "Active now" about themselves on their own request | 20 |
| M69 | Test | Arabic check flagged English *stories and names* written by members | 20 |
| M70 | Dev env | Re-ran the Arabic test on a used database (repeat of M62) | 20 |
| M71 | Design | Story photo stopped short of the card's edge | 20 |
| M72 | Self-review | A test selector would have matched both tick boxes on Account | [[2026-10-21 Session 22]] |
| M73 | Test | `t.user('approved', 'business')` failed: no business details sent | [[2026-10-21 Session 24]] |
| M74 | Test | Fixing the helper made `t.kyc()` always attach the business document, breaking an old test | 24 |
| M75 | Design | Profile name broke mid-word on phones ("Electronic / s") | 24 |
| M76 | Self-review | Feed draft ran one database query per item to hide your own requests | [[2026-10-21 Session 26]] |
| M77 | Test | New browser-test steps left the seller and buyer on other pages; later steps failed (twice) | [[2026-10-21 Session 28]] |
| M78 | Test | Alert test used the description "white" (too short) → 400 (repeat of M56) | [[2026-10-22 Session 31]] |
| M79 | Self-review | First draft of governorate alert matching called a function that didn't exist | 31 |
| M80 | Design | "Sort by" on Compare offers stretched full width under the general form styles | 31 |
| M81 | Design | All small text-buttons (Block, Hide…) were full size: `.linkish` undid `.small` | 31 |
| M82 | Test | Privacy test expected no notifications at all, but every new member gets "identity verified" | [[2026-10-22 Session 34]] |
| M83 | Test | Demand test expected "controller" in the words, but only one *waiting* request had it | 34 |
| M84 | Translation | Arabic plurals written as plain text, and "Area" added twice to `ar.js` | 34 |
| M85 | Test | New browser-test step waited for a demand row, but the test had only 1 open request per category | 34 |
| M86 | Translation | "New" and "Good" added to `ar.js` again (repeat of M84) | 34 |
| M87 | Docs | A docs script broke on quotes inside a heading; the heading was simplified | 34 |
| M88 | Test | Deletion test expected 200 from the photo upload, which answers 201 | [[2026-10-22 Session 37]] |
| M89 | Test | Deletion tests guessed members' ID numbers and email from the database id (twice) | 37 |
| M90 | Test | Arabic browser test waited for the first table on Admin; the dashboard's hidden table now came first | 37 |
| M91 | Design | Hidden hover labels on the dashboard bars still made the Admin page scroll sideways on phones | 37 |
| M92 | Design | Dashboard showed "0 hours" for fast first offers, and very thick bars on the 7-day view | 37 |
| M93 | Design | Pickup checklist items were bold (the site's general label style) | 37 |
| M94 | Translation | "Nothing yet." had no Arabic; the coverage test caught it | 37 |
| M95 | Bug (caught early) | Number hider turned "@riverside.bh" into "@📵" and missed ".biz" links | [[2026-10-22 Session 40]] |
| M96 | Translation | Card page in Arabic still showed "MM/YY", "Tap Payments" and "VISA" | 40 |
| M97 | Test | A KYC test posted right after approval; posting now also needs a card | 40 |
| M98 | Self-review | The chat page and the request page imported each other (for the nudge) | 40 |
| M99 | Self-review | After agreeing a price, the chat would have kept showing 📵 (polling only fetches new messages) | 40 |
| M100 | Self-review | Card status first planned as a lookup that most "me" answers would have missed | 40 |
| M101 | Instructions | Told the owner `cd path\to\Unc-APP`; a placeholder typed as written fails | [[2026-10-22 Session 42]] |
| M102 | Instructions | Folder search `*Unc*` listed hundreds of "function" folders | [[2026-10-25 Session 48]] |
| M103 | Bug | `npm start` printed "listening" and then quit when port 4000 was already taken | [[2026-10-25 Session 49]] |
| M104 | Instructions | Tunnel told to use `localhost`; cloudflared tried IPv6 `[::1]` and the phone got "Bad gateway 502" | [[2026-10-26 Session 53]] |

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

## M36
**A stray "tmp" commit while testing live sync** (never pushed)
- **Context:** to test `scripts/live-sync.mjs` I needed a copy of the repo *including* my unsaved changes, so I made two quick commits, cloned, then tried to undo them with `git reset --soft HEAD~1`.
- **Cause:** that only undid one of the two commits; `git log` showed `tmp` still there.
- **Fix:** `git reset --soft <last real commit>` (here `bb50a14`) — changes kept, temporary commits gone. Checked with `git log` and `git status` before continuing. Nothing had been pushed.
- **Lesson:** for throw-away test copies, don't commit at all — copy the folder instead (`cp -r` / Explorer copy), or note the commit hash first and reset to that exact hash.

## M37
**`fresh databases end on the latest migration` failed after adding migration 4**
- **Cause:** the session-05 test said `assert.equal(version, 3)` — a hard-coded number that's wrong the moment a migration is added.
- **Fix:** `db.js` exports `MIGRATION_COUNT = MIGRATIONS.length`; the test compares against that and also checks the new `ratings` table exists.
- **Lesson:** tests should check the rule ("up to date"), not today's number.

## M38
**`push` listed `ocs/Roadmap.md` — first letter missing**
- **Found by:** the stand-in test (see [[Pull and Push#How it was tested]]).
- **Cause:** the helper `git()` used `.trim()` on git's output. `git status --porcelain` lines *start* with a meaningful space (` M docs/Roadmap.md`, where the first column is empty); trimming the whole output removed it from the first line, so slicing off the 3-character status cut into the file name.
- **Fix:** `.trimEnd()` instead of `.trim()` (`scripts/git-helper.mjs`).
- **Lesson:** don't trim machine-readable output whose columns have meaning.

## M39
**`push` froze at the second question ("Your name:") when answers were typed/pasted ahead**
- **Cause (two steps):** first, each question opened its own reader, and the first reader swallowed all the input. Second, even with one shared reader, Node's `readline` `question()` drops lines that arrive *before* the question is asked — so pasted answers vanished and the script waited forever.
- **Fix:** one reader that **queues** every incoming line; each question takes the next queued answer (or waits). Re-tested with all answers piped in at once, and with each step under a 30-second time limit so a freeze shows as a failure, not a hang.
- **Lesson:** test interactive scripts with input supplied all at once, not only by hand — and always put a timeout on automated runs of anything that can wait for input.

## M40
**Build failed: `Could not resolve '../i18n.jsx' in src/pages/admin/KycReview.jsx`**
- **Cause:** my throw-away translation helper chose `../` or `../../` by looking for "/admin/" in the file path, but I ran it from inside the admin folder with bare file names, so it never saw "/admin/".
- **Fix:** corrected both imports to `../../i18n.jsx`. The build caught it before anything was pushed.
- **Lesson:** helpers that guess paths should use the real file location (absolute path), not the string they were given.

## M41
**`pkill` killed its own shell again (exit 144)** — same cause as [[Mistakes and Fixes#M13]]: stop and start were in one command line. Fixed by running them separately. The rule is now also in `CLAUDE.md`. Lesson stands: **stop in its own call, always**.

## M42
**Logging in as admin on an Arabic browser switched the site to English**
- **Found by:** the Arabic browser test (`npm run e2e:ar`) flagging English text on the admin pages.
- **Cause:** migration 5 first gave every account `language = 'en'` by default. The new "sync with the member's saved language" rule then treated that default as a real choice.
- **Fix:** the column is **NULL until someone actually chooses** (sign-up language, or pressing the button while logged in). NULL → English emails, and the website keeps the browser's language. The migration had not been pushed or run outside tests, so it was corrected in place. Test added.
- **Lesson:** a default value is not a user choice; store "no answer" as empty.

## M43
**Arabic chat box: grey hint text with « » in the wrong places**
- **Cause:** I had put `dir="auto"` on input boxes. An *empty* box with `dir="auto"` is left-to-right, so its Arabic hint text was laid out backwards.
- **Fix:** no `dir="auto"` on inputs/textareas; they follow the page. Display elements keep it.

## M44
**Rating comments shown as ”text“ (reversed quotes) in Arabic**
- **Fix:** the quote marks are part of a translation: `tj('“{text}”', …)` → Arabic `«{text}»`.

## M45
**Prices displayed as "$US 300 – $US 400"**
- **Cause:** in Arabic the number formatter writes "300 US$"; the loose "$" is direction-neutral and gets reordered next to the other price.
- **Fix:** Arabic shows the currency code: "300 USD" (`currencyDisplay: 'code'`).

## M46
**English titles on the Arabic home page: ".possible", "2 controllers" broken around**
- **Cause:** member-written English text inherited the page's right-to-left direction.
- **Fix:** `dir="auto"` on titles, descriptions and messages, and `<bdi>` around names, cities and inline titles — each piece of member text takes its own direction.

## M47
**Old test `registration emails a verification code` failed after emails got `lang`/`dir`**
- **Cause:** it checked for exactly `<html>`. **Fix:** check `/<html[\s>]/` ("is an HTML email"). Same lesson as [[Mistakes and Fixes#M37]]: test the meaning, not the exact text.

## M48
**After confirming the email code, new members skipped the new Welcome step**
- **Symptom:** the browser test landed on `/verification` instead of `/welcome`.
- **Cause:** `VerifyEmail.jsx` had two redirects: the new `navigate('/welcome')` after success, and an older `<Navigate to="/verification">` shown once `user.emailVerified` became true. The second one won the race.
- **Fix:** both use one rule: `user.onboarded ? '/verification' : '/welcome'`.
- **Lesson:** when changing where a flow goes, search for *every* redirect on that page (`grep -n "Navigate\|navigate(" file`).

## M49
**Profile photos looked empty/white in the screenshots**
- **Cause:** the browser test's "photo" was a screenshot of a whole white page with a small box on it — shrunk to an avatar it was just white.
- **Fix:** screenshot only the element (`locator('div').screenshot()`), and a separate colourful "face" test image. Avatars also got a thin border so a white photo still looks like a photo.
- **Lesson:** test data should look like real data, or screenshots can't catch anything.

## M50
**Deleted the app-icon generator right after using it**
- **Cause:** treated it as a throw-away script. But then nobody could re-make the icons without AI — against the vault rule.
- **Fix:** recreated as `scripts/make-icons.mjs` (`node scripts/make-icons.mjs`), documented in [[Step 19 - Phones, tablets and app icons]].
- **Lesson:** anything that produced a committed file is part of the project.

## M51
**iPad (768–899 px): the header wrapped onto 3 lines (115 px tall)**
- **Found by:** `npm run e2e:devices` (header-height check).
- **Cause:** the bottom tab bar only started below 760 px, so tablets got the full desktop header in too little width.
- **Fix:** tab bar and `.hide-phone` apply up to **899 px**.

## M52
**A missing public photo (`/uploads/avatars/nope.jpg`) returned 500**
- **Found by:** a new test in `server/test/photos.test.js` (it failed on the old code).
- **Cause:** `express.static`'s 404 error reached our `errorHandler`, which treated every non-`expose` error as a crash.
- **Fix:** `errorHandler` checks `err.status ?? err.statusCode` first: 404 → `{ error: 'Not found' }`.

## M53
**`review-fixes.test.js` failed after raising the request photo limit from 3 to 6**
- **Cause:** it sent 4 photos to test "too many". **Fix:** send 7 (`MAX_PHOTOS + 1`). **Lesson:** same as [[Mistakes and Fixes#M37]] — tests should use the constant, not a copy of it.

## M54
**Chat Send button squeezed to "Sen / d" on a laptop screen**
- **Found by:** looking at the chat screenshot before committing the photos step.
- **Cause:** the new 📷 button took width; flex items may shrink, so the button's text wrapped.
- **Fix:** `.chat-form .btn, .chat-form .attach { flex-shrink: 0; white-space: nowrap; }`.

## M55
**The session-14 note isn't in `main`**
- **Cause:** pull request #3 was opened and merged first, and the note written afterwards. In session 11 the note was pushed *before* the merge.
- **Fix:** the note is on `claude/vibrant-edison-r9o798` and goes into `main` with the next pull request.
- **Lesson:** for "open and merge", write and push the session note first, then open the pull request.

## M56
**`saved.test.js` failed with 400 on its first run (session 13, logged late)**
- **Cause:** the test made a request titled "Mine". Titles need at least a few characters, so the request was refused before the test reached what it was checking.
- **Fix:** title "My own request". Not logged at the time, which breaks the vault rule; recorded now.
- **Lesson:** test data must pass the app's own validation. Copy values from `helpers.js` defaults.

## M57
**In the browser test, the notifications card always said "blocked"**
- **Cause:** Playwright's default headless Chromium ("headless shell") reports notification permission as denied, even after `grantPermissions(['notifications'])`.
- **Fix/decision:** the browser tests only check that the card shows. The full flow was probed with `chromium.launch({ channel: 'chromium' })` (the newer headless mode), and the server is tested with a fake push service.

## M58
**"Chrome currently does not support the Push API in incognito mode"**
- **Cause:** a normal Playwright browser context is like an incognito window, and Chrome refuses push there on purpose.
- **Fix:** probe with `chromium.launchPersistentContext(folder, { channel: 'chromium' })`. For members, the card now explains private windows (see M59).

## M59
**When subscribing failed, the button stayed greyed out, or showed an English browser error**
- **Found by:** the M58 probe. In the sandbox, subscribing waits forever because Google's push servers can't be reached; in incognito, the error text was "Registration failed - permission denied" in English, even in Arabic.
- **Fix:** `enablePush()` gives up after 20 s and shows a translated message ("Couldn't turn on notifications in this browser. Private/incognito windows can't get them; otherwise check your connection and try again."). The raw error goes to the browser console.
- **Lesson:** anything that waits on another company's server needs a timeout, and browser error text is never shown as-is.

## M60
**The "Email me…" tick box jumped back when clicked**
- **Found by:** the browser test (`locator.uncheck: Clicking the checkbox did not change its state`).
- **Cause:** the box showed `user.emailOffers`, which only changes after the server answers. React put the old value back straight away, so the click looked ignored until the save finished.
- **Fix:** the card keeps its own `checked` state, sets it at once, and puts it back only if the save fails.
- **Lesson:** a control that saves on change must show the change straight away.

## M61
**In the Arabic email, an English message was shown backwards (".months old" at the start)**
- **Found by:** rendering the email to a picture before committing.
- **Cause:** the email used `dir="auto"` and `<bdi>` like the website. Email apps (and the HTML once embedded in some clients) don't apply them, so the English text took the email's right-to-left direction.
- **Fix:** `textDir()` picks `ltr`/`rtl` from the first letter. HTML gets `<span dir=…>` / `<blockquote dir=…>`, and subjects and plain text get Unicode isolate marks (U+2068 … U+2069).
- **Lesson:** emails are not browsers. Look at every email in both languages.

## M62
**`npm run e2e` failed at sign-up the second time**
- **Cause:** it ran twice against the same running server and database, so the test's email addresses already existed.
- **Fix:** each run on a fresh `DATA_DIR`, as before. The real error (M60) only showed in the first run.
- **Lesson:** restart the server on a fresh data folder before every journey run.

## M63
**Two test slips while fixing M61**
- After adding the isolate marks, the exact subject and text checks failed. The tests now strip the invisible marks first (`plain()`).
- Proving the new test "fails on the old code": `git stash push -- server/src/lib/emails.js` removed the *whole new email function* (it was not committed yet), so the test failed for the wrong reason. Instead, the old markup (`dir="auto"`, `<bdi>`) was put back temporarily → 1 failure, then the fix was restored → all pass.
- **Lesson:** "fails on old code" means old *behaviour*, not a missing file.

## M64
**The end-of-session-17 message said "105 automated tests pass"; the run showed 101**
- **Cause:** the number was written from memory instead of copied from the last `npm test` output (`# pass 101`).
- **Fix:** corrected to the owner in session 18; the vault notes (session 17 log, Home, CLAUDE.md) already said 101.
- **Lesson:** copy numbers from the command output, never from memory.

## M65
**A wording change was half-applied: the page said `t('found')` but `ar.js` still had `fulfilled:`**
- **Cause:** the small rename script edited the page first and only then looked for the Arabic line. That line was written without quotes (`fulfilled: 'تمّ'`), so the script stopped with an error after already changing the page.
- **Fix:** fixed the `ar.js` line by hand and ran the remaining renames. The coverage test passed.
- **Lesson:** a script that edits several files should check everything first and change nothing until all checks pass.

## M66
**Greetings would not have been checked for Arabic**
- **Cause:** the first version picked the text from an object of plain strings and passed it to `tj(variable)`. The translation test only finds literal `t('…')` / `tj('…')` calls, so a missing Arabic greeting would have slipped through.
- **Fix:** each greeting is written as its own literal `tj('Good morning, {name}', v)`.
- **Lesson:** never pass a variable as the first argument of `t()`, `tj()` or `tn()`.

## M67
**The new message bubble ("toast") could have covered the chat's Send button**
- **Found by:** self-review before running the tests. The toast sits at the bottom centre, above everything.
- **Fix:** `pointer-events: none` on `.toast`, so taps go through it.

## M68
**"🟢 Active now" shown to a buyer about themselves on their own request**
- **Found by:** the phone screenshot from the all-devices test.
- **Fix:** `{!isOwner && <Activity … />}` in `ListingDetail.jsx`. The chat and profile were fine: in a chat the other person is always someone else, and on profiles seeing it is harmless.

## M69
**The Arabic browser test failed on English words, but they were a member's story and names**
- **Cause:** the check counted all visible text. Stories from the English run appear on the visitors' landing page, so their English text counted as untranslated UI.
- **Fix:** the check now skips text inside `<bdi>` or `dir="auto"` (member text, by the project's own rule) and still checks everything else.
- **Lesson:** a test that checks "the app speaks Arabic" must tell apart what the app says and what members say.

## M70
**`npm run e2e:ar` timed out at sign-up after the M69 fix**
- **Cause:** it was re-run against the same running server, where its accounts already existed. This is the same slip as [[Mistakes and Fixes#M62]].
- **Fix:** restarted the server on a fresh data folder, then ran `e2e` and `e2e:ar` → both OK.
- **Lesson (again):** a fresh `DATA_DIR` for every journey run.

## M71
**Story photos left a gap on the right of the card**
- **Found by:** looking at the Home screenshot.
- **Cause:** the global `img { max-width: 100% }` rule capped the photo's width, and the negative margins used 1 rem where cards have 1.25 rem padding. The loading placeholder had the same margin problem.
- **Fix:** `max-width: none` with 1.25 rem margins (1 rem on phones), like `.card-photo`.

## M72
**The browser test's `.toggle-row input[type=checkbox]` would have matched two tick boxes**
- **Found by:** self-review while adding the Privacy card, before running the test. Playwright refuses a locator that matches several elements ("strict mode"), so the email check would have failed.
- **Fix:** each tick box has `data-setting="emailOffers"` or `data-setting="hideActivity"`, and the test uses those.
- **Lesson:** give test hooks a unique attribute instead of selecting by layout classes.

## M73
**Every new shop test failed with "expected 201, got 400" before reaching shop code**
- **Cause:** the test helper `t.user(stage, accountType)` had never been used for an *approved business* account. Business identity checks also need a business name, a registration number and a business document, and the helper didn't send them.
- **Fix:** for business accounts, the helper now sends `businessName` and `businessRegNumber` and attaches the business document.
- **Lesson:** when a test fails in its set-up, fix the set-up; it isn't evidence about the new feature.

## M74
**After the M73 fix, `business accounts must upload a business document` failed**
- **Cause:** the first version attached the business document whenever a business name was present, so the test that checks the *missing document* error no longer got that error.
- **Fix:** attaching it is now an explicit option, `kyc(agent, overrides, { businessDoc: true })`, used only when creating approved business users.
- **Lesson:** run the whole suite after changing a shared test helper.

## M75
**On phones, the shop name broke mid-word ("Riverside Electronic / s")**
- **Found by:** the iPhone screenshot from `npm run e2e:devices`, which now includes the shop page.
- **Cause:** the profile header put a 96 px photo, the text and the rating side by side, leaving the name about 110 px. The global `overflow-wrap: anywhere` then broke it inside the word. This had been there since session 13, but the shop lines made it obvious.
- **Fix:** under 760 px, the photo is 64 px, the rating moves to its own line, and the name may only wrap between words.

## M76
**The first feed draft asked the database "is this my request?" once per item**
- **Found by:** self-review right after writing it, before any test.
- **Cause:** the own-request filter was written in JavaScript, after the query, with a lookup inside `.filter()`. With 20 requests that would be 20 extra queries on every Home visit.
- **Fix:** the condition moved into the SQL (`AND l.buyer_id <> ?`), so it is one query.
- **Lesson:** filter in the query, not in a loop that queries again.

## M77
**After adding the favourite steps, `npm run e2e` failed twice in later, unchanged steps**
- **Symptom:** first `waiting for 'text=has already rated you'` (the seller), then `waiting for '.chat-head a[href^="/members/"]'` (the buyer) timed out.
- **Cause:** the new steps opened the seller's 🔔 page and the buyer's Saved page in the **same browser tabs** the rest of the journey uses, and never went back. The later steps expected to still be on the chat page.
- **Fix:** remember `page.url()` before the detour and `goto` it afterwards (`vendorChat`, `buyerChat`).
- **Lesson:** a step inserted in the middle of a journey must leave each page where it found it. Check what the next lines expect.

## M78
**`alerts.test.js` failed with "expected 201, got 400" while creating its test request**
- **Cause:** the description was "white". Requests need a longer description, so the request was refused before the alert was tested. This is the same slip as [[Mistakes and Fixes#M56]].
- **Fix:** "White, original, works well".
- **Lesson (again):** test data must pass the app's own rules. When a test fails while setting up, check the data first.

## M79
**The first governorate change to alert matching was tangled, and called `governorateNamedLocal`, which doesn't exist**
- **Found by:** self-review before running anything; it would have crashed on the first alert check.
- **Fix:** rewritten as one rule. If the alert names a governorate (`governorateNamed`), the request's area must be in it; otherwise the city must match as before.
- **Lesson:** when a change gets complicated, stop and write the rule in one sentence first.

## M80
**"Sort by" on Compare offers sat on its own line, and the dropdown stretched across the card**
- **Found by:** the desktop screenshot from the devices check.
- **Cause:** the site's general form styles make `label` a block and `select` full width.
- **Fix:** a `.compare-sort` class (inline-flex, `select { width: auto }`).

## M81
**"🚫 Block" was bigger than "⚑ Report" next to it, and so was every small text-button**
- **Found by:** the scam-warning screenshot.
- **Cause:** `.linkish` sets `font: inherit` and comes *after* `.small` in `styles.css`, so `className="linkish small"` lost the small size everywhere (the story Hide button too).
- **Fix:** `.linkish.small { font-size: .875rem; }`.
- **Lesson:** a shorthand like `font:` resets every font setting. Check combined classes when adding one.

## M82
**`privacy-contact.test.js`: "expected [] but got ['kyc_approved']"**
- **Cause:** the test checked that a seller had *no* notifications after a "shops only" request. But every test member gets an "identity verified" notification when the admin approves them.
- **Fix:** check only that `alert-match` and `favourite-request` are missing.
- **Lesson:** assert the thing you mean ("not told about this request"), not "nothing at all".

## M83
**`demand.test.js` expected `['controller', 'ps5']` but got `['ps5']`**
- **Cause:** I counted "controller" in all three requests, but words come only from requests *still waiting* for an offer. One of the two "controller" requests had an offer.
- **Fix:** the test expects `['ps5']`, with a comment saying why.
- **Lesson:** work out expected values from the rule, not from memory of the test data.

## M84
**Arabic coverage test: "MISSING plural {n} requests" and "ar.js has no duplicate keys"**
- **Cause:** `tn()` plurals need an object with Arabic forms (`{ one, two, few, other }`), but I wrote plain text. I also added `'Area'`, which already existed.
- **Fix:** plural objects like `'{n} offers'`; removed the second `'Area'`.
- **Lesson:** before adding a short key to `ar.js`, search for it first; plurals are always objects. The coverage test catches both.

## M85
**`npm run e2e` timed out waiting for `.demand-row`**
- **Cause:** a category shows only with 2+ open requests. By that point in the browser test, the PS5 request was already found, so each category had only 1. The page rightly showed "Not enough requests here yet".
- **Fix:** the test posts a second furniture request first, then checks for the "Home & Furniture" row with the word "fan".
- **Lesson:** when a page has a minimum, the test must create enough data for it.

## M86
**Arabic coverage test: duplicate keys "New" and "Good"**
- **Cause:** the same slip as [[Mistakes and Fixes#M84]], one step later: both words were already in `ar.js` from earlier sessions.
- **Fix:** removed the new copies (same Arabic). For step 5 I searched `ar.js` for every short key before adding it, and none were duplicates.
- **Lesson (again):** search `ar.js` before adding one-word keys.

## M87
**The script that wrote the decision notes stopped with "SyntaxError"**
- **Cause:** a heading with double quotes inside ("Something went wrong") was put in a Python string through the shell, and the escaping broke.
- **Fix:** the heading became "Thank-you note to other sellers, and deal problems", and the script was saved as a file instead of typed inline. Nothing in the app was affected.

## M88
**`account-deletion.test.js`: "expected 200, got 201" when uploading a profile photo**
- **Cause:** I assumed the photo upload answers 200; it answers 201 (created).
- **Fix:** expect 201.
- **Lesson:** check the real status code of an endpoint before using it in a new test.

## M89
**Deletion tests failed: the banned member's ID "wasn't blocked", and a deleted member's login "worked"**
- **Cause:** the tests built ID numbers and emails from the database id (`user${id}@test.local`), but the test helper numbers members with its own counter (the admin is id 1). So the tests used *another member's* ID and email. The app was right; the tests were wrong.
- **Fix:** a small `verified(idNumber)` helper that verifies a member with a known ID number, and the email is read from `/api/auth/me` before deleting.
- **Lesson:** never guess test data from ids; read it or set it.

## M90
**`npm run e2e:ar` timed out on the Admin page waiting for `table`**
- **Cause:** the dashboard has a hidden "Show as a table" table. It is now the first table on the page, and the test waited for the first one to be visible.
- **Fix:** `waitForSelector('table:visible')` in `e2e/arabic.mjs`.

## M91
**Arabic layout check: "admin: horizontal overflow on phone"**
- **Cause:** the bar labels were hidden with `opacity: 0`. Invisible, but still there: at the right and left edges they reached past the screen, so the page could scroll sideways.
- **Fix:** `display: none` until hover or focus, and the first and last three days' labels are anchored inside the chart.
- **Lesson:** to hide something that is positioned outside its box, take it out of the layout (`display: none`), don't just make it see-through.

## M92
**Dashboard screenshot: "0 hours" to first offer, and very wide bars**
- **Cause:** a median under one hour rounded to 0; with 7 days each bar filled its whole column.
- **Fix:** "Under an hour" below 1 hour; bars at most 24 px wide, centred.

## M93
**Pickup checklist screenshot: every item in bold**
- **Cause:** the site's general `label` style is bold, and each item is a `<label>`.
- **Fix:** `.pickup-item { font-weight: 400 }`.
- **Lesson:** same family as [[Mistakes and Fixes#M80]]: new controls inherit general form styles; check the screenshot.

## M94
**Coverage test: "MISSING Nothing yet."**
- **Cause:** I added "Nothing yet." to the dashboard without Arabic.
- **Fix:** added the Arabic. The search-before-adding habit from [[Mistakes and Fixes#M84]] prevented duplicates this time.

## M95
**The new number hider turned "@riverside.bh" into "@📵" and didn't catch "cheap-ps5.biz"**
- **Found by:** trying a list of examples in the terminal before writing the server code.
- **Cause:** the link rule ran before the @handle rule, so it ate "riverside.bh" and left the "@"; `.biz` wasn't in the list of endings.
- **Fix:** handles are checked before links; added biz, info, xyz, online.
- **Lesson:** for text rules, try a handful of real examples first; the order of rules matters.

## M96
**Arabic check: "English text on page: MM, YY, Tap, Payments" and "VISA"**
- **Cause:** the Arabic wording kept "MM/YY" and "Tap Payments", and the card brand wasn't marked as a name.
- **Fix:** "شهر/سنة", "تاب للمدفوعات", and the brand inside `<bdi>`.

## M97
**`kyc.test.js`: "rejected users can resubmit; admin approval unlocks posting" failed**
- **Cause:** not a bug: the test approves a member by hand and then posts, but posting now also needs a payment card (the new rule).
- **Fix:** the test now checks the new rule too: posting is refused with "payment card" until a card is added.

## M98
**The chat page and the request page imported each other (for the nudge)**
- **Found by:** self-review. It works, but each page would pull the other into its download, and import loops break easily.
- **Fix:** `components/ContactNudge.jsx`, used by both.

## M99
**After agreeing a price, earlier numbers would have stayed 📵 until a full reload**
- **Found by:** self-review of the design: the chat polls every 4 s but only asks for *new* messages.
- **Fix:** the server sends `agreed`; when it turns true, the page fetches the whole chat again once.

## M100
**Card status: the first plan would have shown "no card" after most account actions**
- **Found by:** self-review: the plan was to add `has_card` with a join in the login lookup, but 15 places return the member with `SELECT * FROM users`, which wouldn't include it.
- **Fix:** a `users.card_added_at` column, set when a card is saved, so every answer includes it.
- **Lesson:** look at every place that builds a value before adding a field to it.

## M101
**"The system cannot find the path specified." after `cd path\to\Unc-APP`**
- **Cause:** my answer used a placeholder (`path\to`) instead of the real folder. The owner typed it exactly as given, which is the right thing to do with instructions.
- **Fix:** the real command, `cd Unc-APP` (a new Command Prompt opens in `C:\Users\a.baqer`, where the app was cloned), with `dir` as the fallback. [[Watch Changes Live]] says the same.
- **Lesson:** never give placeholders in commands for the owner. Use the real path (the clone location is known from [[Mistakes and Fixes#M14]]), or say exactly how to find it.

## M102
**The folder search filled the screen with `node_modules\…\function` folders**
- **Cause:** I gave `dir /s /b /ad C:\Users\a.baqer\*Unc*`. Windows file names ignore upper/lower case, so `*Unc*` also matches "f**unc**tion", and `node_modules` folders have hundreds of those.
- **Fix:** `dir /s /b /ad C:\Users\a.baqer\Unc-APP*` (names that *start* with Unc-APP), in [[Run the App Locally]].
- **Lesson:** search patterns for the owner must be specific; think about what else a short pattern matches, especially inside `node_modules`.

## M103
**`npm start` said "Unc API listening on http://localhost:4000", then the prompt came straight back**
- **Found by:** the owner's screenshot during the phone test ([[Step 53 - Test as an app on your phone for free]]).
- **Cause:** port 4000 was still used by the `npm run live` window. Express 5 doesn't throw when the port is taken: it passes the error to the `listen` callback. `server/src/index.js` ignored that argument, printed "listening" anyway, and Node exited because nothing was listening. This has been the case since the project started on Express 5.
- **Fix:** `server/src/lib/listen.js` turns the callback into a clear error, and `index.js` prints *"Could not start Unc: Port 4000 is already in use: another Unc window … Stop it there with Ctrl + C, or start this one on another port (set PORT=4001 first)"* and exits with an error code.
- **Test:** `server/test/listen.test.js` (fails without the fix: the helper doesn't exist; checked with `git stash push -u -- src`). Also checked for real by starting `npm start` twice.
- **Lesson:** a start-up message must come from the real success, not just from the callback being called. With Express 5, always look at the `err` argument of `listen`.

## M104
**Phone: "Bad gateway, error 502"; tunnel window: "dial tcp [::1]:4001 … actively refused it"**
- **Cause:** two things can give exactly this, and both were possible:
  1. the `npm start` window wasn't running any more (the next morning; the PC may have slept);
  2. my instructions said `cloudflared tunnel --url http://localhost:4001`. cloudflared turned `localhost` into the IPv6 address `[::1]`, and the server may only answer on IPv4 (`127.0.0.1`), depending on the PC's network settings.
- **Fix:** the guide now uses `http://127.0.0.1:<port>` and has a "Bad gateway 502" section: check the server window is busy, restart it, restart the tunnel and use the new address.
- **Lesson:** with tunnels and proxies, write `127.0.0.1` instead of `localhost`; "localhost" can mean two different addresses.

