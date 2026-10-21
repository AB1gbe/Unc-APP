---
tags: [decision, workflow]
status: accepted
date: 2026-10-21
---
# ADR-016 Live preview while Claude builds: auto-pull on the owner's PC

## Context
The owner asked for "a way to view the app simultaneously as you edit so I know how it looks and what's happening". Claude works in a cloud container the owner can't open.

## Options considered
| Option | Pros | Cons |
|---|---|---|
| Public tunnel from Claude's container (ngrok / Cloudflare Tunnel) | Real-time, no install | The container's network only allows outgoing web traffic through a proxy, so tunnels generally won't work; also exposes a dev server publicly |
| Screenshots in chat after each step | Zero setup | Not interactive; can't click around |
| Deploy each step to a hosting service | Real URL | Needs a hosting account first (postponed); slower per step |
| **Auto-pull on the owner's PC + the dev servers' hot reload** ✅ | Real app, clickable, on their own machine; updates within ~5–10 s of each push; no account | Needs `npm run live` running; only shows what's been pushed |

## Decision
`scripts/live-sync.mjs` (`npm run live` / `npm run sync`): `git fetch` every 5 s → fast-forward only → `npm install` when package files change. Vite hot-reloads the browser; `node --watch` restarts the API. Never overwrites local edits (pauses instead). Claude pushes in **small, tested steps** so each pull shows one visible change. Screenshots are still shared in chat for key screens.

How to use it: [[Watch Changes Live]].
