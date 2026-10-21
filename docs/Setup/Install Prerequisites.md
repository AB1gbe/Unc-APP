---
tags: [setup]
---
# Install Prerequisites

You need three things. Do this once per computer.

## 1. Node.js 22.13 or newer (includes npm)
- Download the **LTS** installer from https://nodejs.org and run it.
- Check in a terminal (Windows: *PowerShell*; Mac: *Terminal*):
  ```bash
  node -v   # must print v22.13.0 or higher (we built with v22.22.0)
  npm -v    # we used 10.9.4
  ```
- **Why 22.13+?** The database uses `node:sqlite`, which is built into Node from 22.5 but only works *without a special flag* from 22.13. See [[ADR-003 Database]].

## 2. Git
- Download from https://git-scm.com and install with default options.
- Check: `git --version`

## 3. A code editor (optional but recommended)
- [VS Code](https://code.visualstudio.com).

## 4. Obsidian (for this documentation)
- https://obsidian.md → *Open folder as vault* → select the repo's `docs` folder.

## 5. (Optional) Playwright browser — only for the end-to-end test
```bash
npx playwright install chromium
```

Next: [[Run the App Locally]]
