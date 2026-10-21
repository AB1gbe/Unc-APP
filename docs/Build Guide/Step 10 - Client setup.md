---
tags: [build-guide, client]
step: 10
---
# Step 10 — Client setup

## `client/package.json`
```json
{
  "name": "unc-client",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" }
}
```
## Install (from the repo root!)
```bash
npm install react@19 react-dom@19 react-router-dom@7 --workspace client
npm install -D vite@8 @vitejs/plugin-react@6 --workspace client
```
> Vite and its React plugin must be compatible majors — [[Mistakes and Fixes#M4]].

## Core files
| File | Purpose |
|---|---|
| `client/index.html` | `<div id="root">` + `<script type="module" src="/src/main.jsx">` |
| `client/vite.config.js` | React plugin; port 5173; **proxy** `/api` and `/uploads` → `http://localhost:4000` |
| `src/main.jsx` | `<BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter>` |
| `src/api.js` | `api(path, {method, body, form})` — always `credentials: 'include'`; throws `ApiError` with server message; helpers `money`, `budget`, `toDate`, `ago` |
| `src/auth.jsx` | Loads `/api/auth/me` once; `useAuth()` gives `{user, setUser, refresh, logout}`; `user === undefined` means "still loading" |
| `src/hooks.js` | `useApi(path)` → `{data, error, loading, reload}`; `useMeta()` caches categories |
| `src/styles.css` | See [[Design System]] |

Next → [[Step 11 - Client pages]]
