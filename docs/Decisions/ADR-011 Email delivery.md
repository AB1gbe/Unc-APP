---
tags: [decision, email]
status: accepted
date: 2026-10-21
---
# ADR-011 Email delivery: SMTP via nodemailer (+ Resend API option)

## Context
Email codes and reset links must really reach inboxes. The owner hasn't chosen an email provider yet, and should be able to switch provider without code changes.

## Options considered
| Option | Pros | Cons |
|---|---|---|
| One provider's SDK (SendGrid, Postmark, SES SDK) | Provider features | Locks code to that provider; switching = code change |
| **SMTP via nodemailer** ✅ | Every provider (and Gmail) speaks SMTP → switch by editing `.env`; nodemailer is the standard Node mail library with no native parts | Slightly slower than HTTP APIs; some cloud hosts block port 25 (we use 587/465) |
| **Resend HTTP API via `fetch`** ✅ (secondary) | No extra package, simple API key, HTTP works where SMTP ports are blocked | Resend only |
| Self-hosted mail server (Postfix) | Free | Deliverability nightmare (spam folders, IP reputation). ❌ |

## Decision
`MAIL_TRANSPORT` = `console | smtp | resend` (+ `memory` forced in tests). Provider-neutral `sendMail({to, subject, text, html})`; all wording in `emails.js`. Production refuses to start with `console`.

Package added: `nodemailer@^10.1.7` (server). Dev-only: `smtp-server@^3.20.2` so tests send through a real SMTP conversation instead of mocking nodemailer.

## Revisit when
Volume grows or you need bounce/complaint handling → add a webhook from the provider to mark bad addresses.
