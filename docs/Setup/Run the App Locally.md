---
tags: [setup]
updated: 2026-10-21 (session 02)
---
# Run the App Locally

> ⚠️ Every `npm …` command must be run **inside the project folder** (`Unc-APP`), which you get by cloning. Running it anywhere else gives `ENOENT … package.json` — see [[Mistakes and Fixes#M14]].
> Since session 08 the code is on **`main`** (pull request https://github.com/AB1gbe/Unc-APP/pull/1 merged). You can drop the `-b claude/vibrant-edison-r9o798` part from the clone commands below. In a folder cloned earlier, run `git checkout main` then `git pull`.

## Windows (Command Prompt) — step by step
1. Press **Start**, type `cmd`, press Enter.
2. Check Node and Git (install them first if needed → [[Install Prerequisites]]):
   ```
   node -v
   git --version
   ```
   `node -v` must show **v22.13** or higher.
3. Go to the folder where you keep projects (example: your Documents):
   ```
   cd %USERPROFILE%\Documents
   ```
4. Download the code **and switch to the right branch** in one go:
   ```
   git clone -b claude/vibrant-edison-r9o798 https://github.com/AB1gbe/Unc-APP.git
   ```
5. **Enter the project folder** (this is the step that was missing in M14):
   ```
   cd Unc-APP
   ```
   `dir` should now list `package.json`, `server`, `client`, `docs`.
6. Install, add demo data, start:
   ```
   npm install
   npm run seed
   npm run dev
   ```
7. Open **http://localhost:5173** in your browser. Keep the Command Prompt window open — closing it (or pressing **Ctrl + C**) stops the app.

Next time you only need: open cmd → `cd %USERPROFILE%\Documents\Unc-APP` → `npm run dev`.
To get new changes later: `git pull` (inside the folder), then `npm install`.

## Mac / Linux
```bash
git clone -b claude/vibrant-edison-r9o798 https://github.com/AB1gbe/Unc-APP.git
cd Unc-APP
npm install
npm run seed      # optional
npm run dev       # http://localhost:5173
```

## Settings (.env file)
Copy `.env.example` to `.env` in the project folder (Windows: `copy .env.example .env`) and edit it in Notepad / VS Code. The server reads it automatically. Without a `.env` everything still works with development defaults: emails are printed in the terminal. Real email → [[Email Sending]]. All options → [[Environment Variables]].

## Accounts you can use
| Who | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@unc.local` | `ChangeMe123!` | Always created on first start. Change via [[Environment Variables]]. |
| Demo buyer | `buyer@demo.local` | `Password123` | Only after `npm run seed`. Already verified. |
| Demo shop | `vendor@demo.local` | `Password123` | Business account, verified. |
| Demo freelancer | `freelancer@demo.local` | `Password123` | Individual, verified. |

## Try the whole flow yourself
1. Sign up a new account → **Check your email**. Without real email configured, the 6-digit code is shown on the page *and* printed in the terminal running the app (look for `[mail]`).
2. Enter the code → **Verify your identity** → fill in details and upload any 3 images (ID front, back, selfie).
3. In another browser (or a private window) log in as **admin** → *Admin* → *Review* → **Approve**.
4. Back as the user → refresh → you're verified → **Post a request**.
5. Log in as `vendor@demo.local` → open the request → **Make an offer**.
6. Back as the buyer → **Messages** → reply.
7. Log out → *Log in* → **Forgot password?** → the reset link appears in the terminal (or your inbox with real email) → open it → choose a new password.

## Useful commands (run inside the project folder)
| Command | What it does |
|---|---|
| `npm run dev` | API + website with auto-reload |
| `npm run dev:server` / `npm run dev:client` | Only one of them |
| `npm test` | Run the API tests (75 as of session 12 — fewer means you need `pull`) |
| `npm run build` | Build the website into `client/dist` |
| `npm start` | Run the API, which also serves the built website on :4000 |
| `npm run seed` | Admin + demo data (incl. one rated deal) |
| `pull` / `push` | Get the latest / upload your changes → [[Pull and Push]] |
| `npm run live` | App + auto-pull of pushed changes → [[Watch Changes Live]] |
| `npm run mail:test -- you@example.com` | Send one test email with your `.env` settings ([[Email Sending]]) |
| `npm run e2e` | Browser test (needs `npm run build` + `npm start` on a fresh DB) |
| `npm run e2e:ar` | Same journey in Arabic, with right-to-left / phone / English-leak checks |

## Reset everything
Stop the app (Ctrl + C) and delete the `server/data` folder (database + uploads). It's recreated on next start.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| `npm error enoent Could not read package.json` | You're not inside the project folder. `cd` into `Unc-APP` first (`dir` / `ls` must show `package.json`). [[Mistakes and Fixes#M14]] |
| `git` is not recognized | Install Git, then **open a new** Command Prompt. |
| Folder exists but has only `README.md` | You cloned `main`. Inside the folder run `git checkout claude/vibrant-edison-r9o798`. |
| `No such built-in module: node:sqlite` or `bad option: --env-file-if-exists` | Node is too old. Install 22.13+. |
| `EADDRINUSE :4000` | Something already uses port 4000 (often an old copy of the app in another window). Close it, or put `PORT=4001` in `.env`. |
| Website loads but every action says "Please log in" | You opened `:4000` while running `npm run dev`; use `:5173`, or run `npm run build` first. |
| Lost the email code / reset link | Click *Send a new code* / request a new link; without real email both are printed in the terminal. |
| Real emails don't arrive | Run `npm run mail:test -- you@example.com` and read the hint. See [[Email Sending]]. |
