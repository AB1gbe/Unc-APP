---
tags: [build-guide, admin]
step: 8
---
# Step 08 — Admin and moderation

**File:** `server/src/routes/admin.js` — `r.use(requireAdmin)` at the top protects every route below it.

Endpoints: [[API Reference]] (Admin section). Behaviour: [[Admin and Moderation]].

Points worth copying exactly:
- Every sensitive read (KYC file, reported conversation) writes `audit_log`.
- A rejection **must** include a note (it's shown to the user).
- A decision on an already-decided submission → 409 (prevents two admins double-deciding).
- Banning deletes sessions; can't ban yourself.

Next → [[Step 09 - Automated API tests]]
