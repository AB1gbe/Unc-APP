---
tags: [build-guide]
step: 1
---
# Step 01 — Create the repo and workspaces

**Goal:** one repository containing two packages (`server`, `client`) that install with a single `npm install`.
**Why workspaces:** one lock file, one install, shared scripts. See [[ADR-002 Tech stack]].

## Commands
```bash
git clone https://github.com/AB1gbe/Unc-APP.git
cd Unc-APP
mkdir -p server/src/lib server/src/middleware server/src/routes server/src/kyc/providers server/test
mkdir -p client/src/pages/admin client/src/components
mkdir docs e2e
```

## Create `package.json` (root)
```json
{
  "name": "unc-app",
  "private": true,
  "version": "0.1.0",
  "workspaces": ["server", "client"],
  "engines": { "node": ">=22.13.0" },
  "scripts": {
    "dev": "concurrently -n api,web -c blue,green \"npm:dev:server\" \"npm:dev:client\"",
    "dev:server": "npm run dev --workspace server",
    "dev:client": "npm run dev --workspace client",
    "build": "npm run build --workspace client",
    "start": "npm run start --workspace server",
    "seed": "npm run seed --workspace server",
    "test": "npm test --workspace server",
    "e2e": "node e2e/smoke.mjs"
  }
}
```
> ⚠️ I first wrote `dev` with `&` — that breaks on Windows. See [[Mistakes and Fixes#M1]].

```bash
npm install -D concurrently
```

## Create `.gitignore`
```
node_modules/
client/dist/
server/data/
.env
*.log
.DS_Store
docs/.obsidian/workspace.json
docs/.obsidian/workspace-mobile.json
e2e/screenshots/
```
`server/data/` holds the database and **KYC documents** — it must never be committed.

## ⚠️ Golden rule for installing packages
Always from the **root**, targeting a workspace:
```bash
npm install <package> --workspace server
npm install -D <package> --workspace client
```
Never `cd client && npm install …` — see [[Mistakes and Fixes#M5]].

Next → [[Step 02 - Server skeleton]]
