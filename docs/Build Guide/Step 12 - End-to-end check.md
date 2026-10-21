---
tags: [build-guide, testing]
step: 12
---
# Step 12 — End-to-end check

**File:** `e2e/smoke.mjs`. Drives Chromium through: register (individual) → email code → KYC → register (business) → email code → KYC + business doc → admin approves both → buyer posts a request with a photo → vendor browses, opens it, sends a $380 offer → buyer sees it in inbox, replies → vendor sees reply → mobile home screenshot.

## Run it
```bash
npm install                         # playwright is a root devDependency
npx playwright install chromium     # one-time browser download
npm run build
# start with a FRESH data folder so emails don't already exist:
#   Mac/Linux:   DATA_DIR=/tmp/unc-e2e npm start
#   PowerShell:  $env:DATA_DIR="$env:TEMP\unc-e2e"; npm start
npm run e2e                         # in a second terminal → "E2E OK"
```
Screenshots land in `e2e/screenshots/`. The ones in `docs/attachments/` came from this run.

## Then look at the screenshots
Tests passing ≠ looks right. Looking at them found [[Mistakes and Fixes#M10]].

Next → [[Step 13 - Real email sending]]
