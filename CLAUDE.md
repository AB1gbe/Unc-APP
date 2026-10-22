# Instructions for AI assistants working on this repo

## Standing rule from the owner: ALWAYS document in the Obsidian vault
The `docs/` folder is an Obsidian vault and the single source of truth. For **every** session or chat — even one with no code changes — update it so the owner can replicate everything **without AI**:

1. **Session log**: create `docs/Sessions/YYYY-MM-DD Session NN.md` from `docs/Templates/Session Log Template.md` and add a row to `docs/Sessions/Sessions Index.md`. Record what was asked, what was done in order, commands run, files changed, commits.
2. **Mistakes**: every error, wrong turn, failed command, or bug (including ones caught in self-review) goes in `docs/Mistakes and Fixes.md` as the next `M<number>` with symptom, cause, fix, lesson. Update the totals and the table.
3. **Decisions**: any choice between options gets an ADR in `docs/Decisions/` (options table, decision, revisit-when) and a row in `Decisions Index.md`.
4. **How / where**: new or changed features → update the matching `docs/Features/*.md`, `docs/Architecture/*` (schema, API, folder map) and add or amend a `docs/Build Guide/Step NN` note with exact commands and file paths.
5. Update the status table in `docs/00 Home.md`.
Use Obsidian `[[wikilinks]]`; put images in `docs/attachments/`.

## Project facts
- Reverse marketplace: buyers post requests; verified vendors contact them **only about a specific request**.
- npm workspaces: `server/` (Express 5, node:sqlite) and `client/` (React 19, Vite 8). Always install from the root with `--workspace`.
- `npm test` must stay green (159+ tests). Layout changes: also run `npm run e2e:devices` (needs `npm run seed` and a running server). New text needs Arabic in `client/src/locales/ar.js`; the coverage test fails otherwise. New bug fix = new test that FAILS on the old code (check with `git stash push -- server/src`). Schema changes = append to `MIGRATIONS` in `server/src/db.js`, never edit old entries.
- Never add an endpoint or UI that lets users message each other outside a listing's conversation.
- Never serve `uploads/kyc` or `uploads/chat` statically, and never return full ID numbers. Chat photos go only to that conversation's two members.
- Email goes through `sendMail`/`trySendMail` in `server/src/lib/mailer.js`; wording lives in `server/src/lib/emails.js`. Never return tokens or codes in API responses outside console/test mode.
- The owner runs Windows (cmd). Give Windows-friendly commands, and say which folder and branch to be in.
- When giving setup steps, say first whether they are optional and why they matter, before the instructions.
- Stopping a server from a shell: one `pkill` per call, with a self-safe pattern like `src/index[.]js`.
- Behind a hosting proxy set `TRUST_PROXY` (see docs/Decisions/ADR-014). Hot queries must keep using indexes (`server/test/performance.test.js`).
- The owner may be watching with `npm run live` (auto-pulls the branch). Push in small, tested steps so each pull shows one working change; never push a red build.
- The owner uses `pull` / `push` (scripts/git-helper.mjs) and may push to the working branch too: always fetch and merge before pushing. Research notes go in docs/Research/.
- Every visible UI word goes through t()/tj()/tn() (client/src/i18n.jsx) with Arabic in client/src/locales/ar.js; server messages get Arabic in server/src/lib/i18n.js. Use logical CSS (inline-start/end), dir="auto"/<bdi> for member text (not on inputs). Check with `npm run e2e:ar`. See docs/Features/Arabic and RTL.md.
