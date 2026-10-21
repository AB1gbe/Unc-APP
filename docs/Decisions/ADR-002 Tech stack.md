---
tags: [decision]
status: accepted
date: 2026-10-21
---
# ADR-002 Tech stack: Express API + React (Vite) client

## Context
Need: accounts, file uploads, private messaging, an admin panel, tests. Must be understandable for someone replicating it by hand.

## Options considered
| Option | Pros | Cons |
|---|---|---|
| Next.js (full-stack React) | One framework, popular | Server components/app router add many concepts; "magic" makes manual replication harder; rule enforcement spread across server actions |
| Django (Python) | Built-in admin and auth | Two languages (Python + JS for UI); admin UI is generic |
| Laravel (PHP) / Rails (Ruby) | Batteries included | New language + ecosystem; heavier hosting |
| **Express (Node) API + React SPA via Vite** ✅ | One language (JavaScript) everywhere; every rule visible in plain route files; minimal magic; huge community | We write a bit more ourselves (validation, sessions) |

## Decision
- **server/**: Node.js 22, Express 5 (async errors handled natively), ES modules.
- **client/**: React 19, React Router 7, Vite 8.
- One repository with **npm workspaces** so `npm install` at the root sets up both.

Exact versions used (from `package.json` files):
| Package | Version | Why |
|---|---|---|
| express | ^5.3.0 | Web framework; v5 forwards errors from `async` routes automatically |
| multer | ^2.4.0 | File uploads |
| helmet | ^8.3.0 | Security headers |
| express-rate-limit | ^8.7.1 | Brute-force protection on login/register/codes |
| cookie-parser | ^1.4.7 | Read the session cookie |
| supertest (dev) | ^7.3.1 | API tests |
| react / react-dom | ^19.3.1 | UI |
| react-router-dom | ^7.18.4 | Pages / URLs |
| vite (dev) | ^8.3.4 | Dev server + build |
| @vitejs/plugin-react (dev) | ^6.1.2 | JSX support for Vite — **must match Vite 8**, see [[Mistakes and Fixes#M4]] |
| concurrently (dev, root) | ^10.0.6 | Runs API + client together, works on Windows — see [[Mistakes and Fixes#M1]] |
| playwright (dev, root) | 1.56.1 | Browser end-to-end test |

## Revisit when
SEO for listing pages matters (search engines indexing requests) → consider server-side rendering (Next.js or Vite SSR) for the public pages only.
