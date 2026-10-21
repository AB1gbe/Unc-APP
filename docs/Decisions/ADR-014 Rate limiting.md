---
tags: [decision, security]
status: accepted
date: 2026-10-21
---
# ADR-014 Rate limiting: one counter per action, real visitor IPs behind proxies

## Context
Found in the session-05 review ([[Mistakes and Fixes#M24 – M35: bugs found by the code review (session 05)|Mistakes and Fixes M24–M35]]): one shared 20-per-15-minutes counter covered login, sign-up, codes and resets, and the app didn't know it runs behind a proxy on hosts like Render — so **every visitor would have shared one counter** and the site would lock everyone out shortly after launch.

## Options considered
| Option | Pros | Cons |
|---|---|---|
| Keep one shared limiter | Simple | Opening a reset link used up login attempts; proxy problem remains |
| Limit per email address instead of IP | Stops guessing one account from many IPs | Lets an attacker lock a victim out by spamming their email |
| **Separate limiter per action, keyed by real client IP (`trust proxy`)** ✅ | Each action has a fitting limit; works behind proxies | Must set `TRUST_PROXY` correctly when deploying |
| Hosted bot protection (Cloudflare Turnstile etc.) | Strong | Extra service; maybe later for sign-up |

## Decision
Per 15 minutes per IP: register 10, login 20, verify-email 20, resend-code 5, forgot-password 5, reset-link check 30, reset 10, change-password 10 (`server/src/routes/auth.js`).
`TRUST_PROXY` env var → `app.set('trust proxy', …)`: **0 locally, 1 on Render/Railway/Fly/behind one nginx.** Never set it higher than the real number of proxies — otherwise visitors can fake their IP with an `X-Forwarded-For` header and dodge the limit.
