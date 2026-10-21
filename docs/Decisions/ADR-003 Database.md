---
tags: [decision]
status: accepted
date: 2026-10-21
---
# ADR-003 Database: SQLite through Node's built-in `node:sqlite`

## Options considered
| Option | Pros | Cons |
|---|---|---|
| PostgreSQL | Industry standard, scales, concurrent writers | Separate server to install/run — big hurdle for local replication |
| MongoDB | Flexible documents | Our data is relational (users ↔ listings ↔ conversations ↔ messages); constraints like `UNIQUE(listing_id, vendor_id)` are natural in SQL |
| better-sqlite3 (npm package) | Fast, mature SQLite driver | **Native module** — needs compiling or a matching prebuilt binary; frequent install failures on Windows/new Node versions |
| Prisma ORM | Nice schema file, migrations | Extra code generator + engine binary; hides the SQL that enforces our business rules |
| **`node:sqlite` (built into Node 22)** ✅ | Zero install, zero native compile, real SQL constraints, single file = easy backup | Marked *experimental* (prints a warning); one-server only |

## Decision
`node:sqlite` with hand-written SQL and a tiny migration runner (`server/src/db.js`).

### How we handle the "experimental" warning
Node prints `ExperimentalWarning: SQLite is an experimental feature`. Every script in `server/package.json` runs node with `--disable-warning=ExperimentalWarning` to keep logs clean. Verified on Node v22.22.0 with SQLite 3.50.4.

### Rules are enforced *in the database*, not only in code
- `UNIQUE (listing_id, vendor_id)` on `conversations` → one thread per vendor per request.
- `CHECK (buyer_id <> vendor_id)` → can't talk to yourself.
- `CHECK (kyc_status IN (...))` etc. → no invalid states.
- `PRAGMA foreign_keys = ON` → no orphaned rows.

## Revisit when
More than one server instance, or heavy write traffic → PostgreSQL. The SQL is standard enough to port (`datetime('now')` → `now()`, `AUTOINCREMENT` → `GENERATED ALWAYS AS IDENTITY`).
