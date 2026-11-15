---
tags: [decision, product]
status: accepted
date: 2026-11-15
---
# ADR-081 Launch focus

From [[Honest Review 2026-11-15]]; the owner: "do the rest of these things".

| Point | Decision |
|---|---|
| 1. Identity | Unc = **verified shops answer what you're looking for, plus safe housing and jobs without scams.** Wanted (requests) is the core. |
| 3. No users | Free launch period: businesses aren't charged (`CHARGE_BUSINESSES` off). Launch area and categories: see [[Launch Plan]]. |
| 4. Too many features | Extra features hidden by `client/src/features.js` (code kept). Visible: post, browse, chat, rate, report, business panel (dashboard, ads, billing). |

**Revisit when:** real users ask for a hidden feature, or after the first month of the launch area.
