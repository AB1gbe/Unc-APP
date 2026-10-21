---
tags: [decision, security]
status: accepted
date: 2026-10-21
---
# ADR-008 File storage: local disk, private KYC folder

## Options considered
| Option | Pros | Cons |
|---|---|---|
| **Local disk under `DATA_DIR/uploads`** ✅ | Zero setup, easy backup with the DB | Single server only |
| S3 / Cloudflare R2 | Scales, cheap | Account + keys + SDK; harder local replication |
| Database BLOBs | One file to back up | Bloats DB, slower |
| Cloudinary | Image resizing | Third party holding ID documents — privacy risk |

## Decision
- `uploads/listings/` — **public** reference photos, served at `/uploads/listings/<file>`.
- `uploads/kyc/` — **private**. Never served statically. Only `GET /api/admin/kyc/:id/file/:field` (admins) streams them, with `Cache-Control: no-store`, and logs the access.
- Files renamed to random names (never the user's filename), type detected from **magic bytes**, 5 MB limit, max 3 listing photos / 4 KYC files.

## Revisit when
Moving to multiple servers → S3-compatible storage with **private** bucket + short-lived signed URLs for KYC files.
