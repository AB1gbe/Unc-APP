---
tags: [build-guide]
step: 3
---
# Step 03 — Database

**File:** `server/src/db.js`. Full table list: [[Database Schema]]. Why SQLite/`node:sqlite`: [[ADR-003 Database]].

## How it's built
1. `import { DatabaseSync } from 'node:sqlite'` — no package to install.
2. `MIGRATIONS` = an array of SQL strings. Index 0 creates all tables.
3. `openDb(file)`:
   - creates the folder, opens the file (or `':memory:'` for tests),
   - `PRAGMA foreign_keys = ON` (SQLite has them **off** by default!),
   - `PRAGMA journal_mode = WAL` (better concurrent reads),
   - runs `migrate()`.
4. `migrate()` reads `PRAGMA user_version`, runs each newer migration inside `BEGIN … COMMIT`, then bumps `user_version`.
5. Helpers: `tx(db, fn)` runs `fn` in a transaction; `audit(db, actorId, action, target, meta)` writes `audit_log`.

## Business rules that live in the schema
- `conversations`: `listing_id NOT NULL`, `UNIQUE (listing_id, vendor_id)`, `CHECK (buyer_id <> vendor_id)` → MUST #3.
- `CHECK` lists on every status column → impossible states can't be saved.

## Check it
Start the server once; `server/data/unc.sqlite` appears. Open it in *DB Browser for SQLite* to see the tables.

Next → [[Step 04 - Accounts, sessions and email codes]]
