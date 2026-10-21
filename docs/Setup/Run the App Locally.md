---
tags: [setup]
---
# Run the App Locally

## First time
```bash
git clone https://github.com/AB1gbe/Unc-APP.git
cd Unc-APP
npm install            # installs server + client packages (npm workspaces)
npm run seed           # optional: creates admin + demo accounts + 3 demo requests
npm run dev            # starts API on :4000 and website on :5173
```
Open **http://localhost:5173**.

## Accounts you can use
| Who | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@unc.local` | `ChangeMe123!` | Always created on first start. Change via [[Environment Variables]]. |
| Demo buyer | `buyer@demo.local` | `Password123` | Only after `npm run seed`. Already verified. |
| Demo shop | `vendor@demo.local` | `Password123` | Business account, verified. |
| Demo freelancer | `freelancer@demo.local` | `Password123` | Individual, verified. |

## Try the whole flow yourself
1. Sign up a new account → you land on **Check your email**. In development the 6-digit code is shown on the page *and* printed in the terminal running the server (look for `[mail]`).
2. Enter the code → **Verify your identity** → fill in details and upload any 3 images (ID front, back, selfie).
3. In another browser (or a private window) log in as **admin** → *Admin* → *Review* → **Approve**.
4. Back as the user → refresh → you're verified → **Post a request**.
5. Log in as `vendor@demo.local` → open the request → **Make an offer**.
6. Back as the buyer → **Messages** → reply.

## Useful commands (run from the repo root)
| Command | What it does |
|---|---|
| `npm run dev` | API + website with auto-reload |
| `npm run dev:server` / `npm run dev:client` | Only one of them |
| `npm test` | Run the 21 API tests |
| `npm run build` | Build the website into `client/dist` |
| `npm start` | Run the API, which also serves the built website on :4000 |
| `npm run seed` | Admin + demo data |
| `npm run e2e` | Browser test (needs `npm run build` + `npm start` on a fresh DB) |

## Reset everything
Stop the server and delete the `server/data` folder (database + uploads). It's recreated on next start.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| `No such built-in module: node:sqlite` | Node is too old. Install 22.13+. |
| `EADDRINUSE :4000` | Something already uses port 4000 (often an old server). Close it, or set `PORT=4001`. |
| Website loads but every action says "Please log in" | You opened `:4000` while running `npm run dev`; use `:5173`, or run `npm run build` first. |
| Lost the email code | Click *Send a new code*, or read it from the server terminal. |
