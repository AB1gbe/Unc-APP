---
tags: [setup, workflow, git]
---
# Pull and Push (one word each)

**Optional but handy.** Instead of pasting several git commands, type one word in Command Prompt **inside the `Unc-APP` folder**.

| Type | What happens |
|---|---|
| `pull` | Downloads the latest changes for the branch you're on, and runs `npm install` only if the package list changed |
| `pull main` | Switches to `main` (or any branch name) and downloads its latest |
| `push` | Shows your changes → runs the tests if you changed code → asks "Upload? (y/n)" → asks for a short description → saves, merges in anything new from GitHub (e.g. Claude's pushes), uploads |
| `push fixed typo in roadmap` | Same, using "fixed typo in roadmap" as the description |
| `push -y` | Don't ask "are you sure?" |

On Mac/Linux, or in PowerShell: `npm run pull` and `npm run push -- your description`. (PowerShell doesn't run files from the current folder by name; there you can also type `.\push`.)

## First time you push
- It asks for your **name and email** once (git labels each change with them). Use the email of your GitHub account.
- Git for Windows may open a **browser window to log in to GitHub**. Log in once; Windows remembers it.

## Safety rules built in
- Never uploads `.env`, the database (`*.sqlite`) or `server/data/` (KYC photos), even if one were added by mistake.
- Changed code (`server/`, `client/`, `scripts/`, `e2e/`, package files)? It runs `npm test` first and **refuses to upload if any test fails**.
- `pull` refuses to run while you have unsaved edits (so it can't mix things up) and tells you to `push` first.
- Answering `n` cancels; nothing is changed.

## Conflicts
If you and someone else (e.g. Claude) changed **the same lines of the same file**, `push` stops with *"…edit the same lines, so they can't be combined automatically. Nothing was lost."* Your change is saved on your PC, nothing was uploaded, and nothing is left half-done. To fix it:
- Easiest: ask Claude to sort it out.
- Or by hand: `git pull` → open the file shown → keep the lines you want and delete the `<<<<<<<`, `=======`, `>>>>>>>` markers → save → `push`.

## Where the code is
`scripts/git-helper.mjs`; `pull.cmd` and `push.cmd` in the project folder (they just run that script; they must keep Windows line endings, enforced by `.gitattributes`); scripts `pull`/`push` in the root `package.json`.

## How it was tested
A stand-in setup on Claude's side: a local "GitHub" (bare repo), a "your PC" copy and a "Claude" copy. Checked: up-to-date pull; pulling Claude's push; first push asking name/email/description; pushing while Claude pushed a different file (merged and uploaded); same-line conflict (stopped cleanly, nothing lost); answering `n`; pull with unsaved edits (refused); `.env` (blocked); `pull main` (switched); code change with failing tests (blocked). Two bugs found and fixed on the way: [[Mistakes and Fixes#M38]], [[Mistakes and Fixes#M39]].
