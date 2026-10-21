---
tags: [reference]
---
# Glossary

| Term | Meaning |
|---|---|
| **ADR** | *Architecture Decision Record* — a short note saying what we decided, which options we compared, and why. See [[Decisions Index]]. |
| **API** | The set of URLs (like `POST /api/listings`) the website calls to read/write data. See [[API Reference]]. |
| **Backend / server** | The program that stores data and enforces rules. Lives in `server/`. |
| **bcrypt / scrypt** | Slow password-hashing algorithms. We use **scrypt** (built into Node). Passwords are never stored as-is. |
| **Cookie (httpOnly)** | A small value the browser stores and sends back automatically. *httpOnly* means page JavaScript can't read it (protects against stolen sessions). |
| **CSP** | *Content Security Policy*: a header telling the browser what it may load (images, scripts). Set by Helmet. |
| **CSRF** | *Cross-Site Request Forgery*: another website tricking your browser into making requests. Blocked by `SameSite=Lax` cookies. |
| **Express** | The Node.js web framework used for the API. |
| **Frontend / client** | The React website that runs in the browser. Lives in `client/`. |
| **Hash** | A one-way fingerprint of a value. You can check a value against it but not reverse it. |
| **Helmet** | Express add-on that sets security headers. |
| **KYC** | *Know Your Customer*: checking a person is who they say they are (government ID + selfie). |
| **Listing** | In the code, a buyer's *request*. |
| **Magic bytes** | The first bytes of a file that reveal its real type (a PNG always starts `89 50 4E 47`). Used to reject fake images. |
| **Migration** | A numbered, append-only database change script. See [[Step 03 - Database]]. |
| **Monorepo / workspaces** | One git repository holding several packages (`server`, `client`) managed by npm workspaces. |
| **Multer** | Express add-on that reads uploaded files. |
| **node:sqlite** | SQLite database built into Node.js 22+. No extra install. |
| **Pepper** | A secret mixed into hashes, stored outside the database (`SECRET_PEPPER`). A stolen database alone is then not enough to crack hashes. |
| **Playwright** | Tool that drives a real browser for end-to-end tests. |
| **Polling** | Asking the server "anything new?" every few seconds. How chat updates. See [[ADR-007 Real-time updates]]. |
| **Rate limit** | Max number of attempts per time window (stops password guessing). |
| **React** | JavaScript library for building the user interface. |
| **Route guard** | A wrapper component that redirects you if you're not allowed on a page. |
| **Session** | "You are logged in" state: a random token in a cookie, its hash stored in the `sessions` table. |
| **SQLite** | A database stored in a single file. |
| **SMTP** | The standard protocol for sending email. Every email provider offers an SMTP server address, port and login. |
| **nodemailer** | The Node.js library that sends email over SMTP. |
| **SPF / DKIM / DMARC** | DNS records proving your domain allowed a provider to send its email. Without them emails go to spam. |
| **App Password** | A special Gmail password for apps, needed for Gmail SMTP (requires 2-step verification). |
| **.env file** | A text file of `NAME=value` settings read at startup. Never committed. |
| **Account enumeration** | Finding out which emails are registered by watching how the site responds. We give identical answers to prevent it. |
| **Token (reset)** | A long random secret in the reset link. Only its hash is stored. |
| **Supertest** | Library to call the API from tests without starting a real server. |
| **Vite** | The development server and build tool for the React client. |
