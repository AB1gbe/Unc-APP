---
tags: [build-guide]
step: 2
---
# Step 02 — Server skeleton

## `server/package.json`
```json
{
  "name": "unc-server",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "dev": "node --disable-warning=ExperimentalWarning --watch src/index.js",
    "start": "node --disable-warning=ExperimentalWarning src/index.js",
    "seed": "node --disable-warning=ExperimentalWarning src/seed.js",
    "test": "node --disable-warning=ExperimentalWarning --test \"test/*.test.js\""
  }
}
```
- `"type": "module"` → we can use `import`/`export`.
- `--watch` restarts the server when you save a file (built into Node).
- `--disable-warning=ExperimentalWarning` hides the `node:sqlite` notice ([[ADR-003 Database]]).

## Install
```bash
npm install express@5 multer@2 helmet express-rate-limit cookie-parser --workspace server
npm install -D supertest --workspace server
```

## Files to create (copy from the repo; what each does)
| File | Purpose | Key idea |
|---|---|---|
| `server/src/config.js` | Every setting from env vars with dev defaults | Throws in production if `SECRET_PEPPER` missing |
| `server/src/lib/http.js` | `HttpError` class + `errorHandler` | Routes just `throw new HttpError(403, 'msg')`; Express 5 catches async throws |
| `server/src/lib/validate.js` | `str`, `int`, `oneOf`, `email`, `isoDate`, `password`, `ageOn` | Each returns a clean value or throws a 400 with the `field` name so the UI can point at it |
| `server/src/lib/crypto.js` | scrypt password hash/verify, `randomToken`, `sha256`, `pepperedHash` (HMAC), `sixDigitCode` | Only Node built-ins |
| `server/src/app.js` | `createApp(db)`: helmet, JSON parser (100 kb), cookies, `loadUser`, routes, static files, error handler | Separate from `index.js` so tests can build an app without listening |
| `server/src/index.js` | Open DB → `ensureAdmin` → `listen(4000)` | |

## Check it
```bash
npm run dev:server
# in another terminal:
curl http://localhost:4000/api/health      # {"ok":true}
```

Next → [[Step 03 - Database]]
