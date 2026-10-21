---
tags: [setup, workflow]
---
# Watch Changes Live

**Optional.** Use it when you want to watch the app change while Claude (or anyone) is working on it and pushing to GitHub. You don't need it to run the app normally.

## Why it works this way
Claude works on a computer in the cloud, which you can't open directly. Every time Claude pushes a step to GitHub, your PC can pull it automatically, and the app you're already running updates itself:
- **Website changes** appear in the browser without reloading (Vite "hot reload").
- **Server changes** restart the API automatically (`node --watch`).

Options we compared → [[ADR-016 Live preview while building]].

## Start it (Windows Command Prompt)
```
cd %USERPROFILE%\Documents\Unc-APP
git fetch
git checkout <branch-name-Claude-gives-you>
git pull
npm install
npm run live
```
Open **http://localhost:5173** and keep the Command Prompt window open. You'll see three coloured streams: `api` (server), `web` (website), and `sync`. When Claude pushes, `sync` prints something like:
```
[sync 7:03:09 AM] Pulled 3 changed file(s):
  • Add star rating widget
```
and the browser updates a moment later. Stop it with **Ctrl + C**.

## What it never does
- It never overwrites your own edits. If you changed a file, it prints *"syncing is paused"* until you undo (`git checkout -- .`) or commit them.
- It only moves *forward* along the branch (fast-forward). If your copy has commits that aren't on GitHub, it pauses.

## If something looks stuck
| Symptom | Fix |
|---|---|
| Browser shows an old page | Refresh (F5) once. |
| `api` shows a crash after a sync that changed `package.json` | The sync runs `npm install` itself; once it finishes, press Ctrl + C and run `npm run live` again. |
| Red `[web] http proxy error: /api/... ECONNREFUSED` lines right after `Restarting 'src/index.js'` | Harmless. A sync changed server files, so the API restarts for a few seconds; the page's requests during that gap fail. When `[api] Unc API listening on http://localhost:4000` appears, it works again (refresh if the page looks empty). Only a problem if that "listening" line never comes. |
| `[api] ../.env not found. Continuing without it.` | Normal: no `.env` means emails are printed in this window instead of sent. See [[Email Sending]]. |
| Sync says it's paused | Read the message — usually a local edit to undo. |
| You want only the syncing, not the app | `npm run sync` |

## Where the code is
`scripts/live-sync.mjs` (every 5 s: `git fetch` → fast-forward → `npm install` if package files changed). Scripts `live` and `sync` in the root `package.json`.
