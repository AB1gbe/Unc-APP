---
tags: [decision, privacy]
status: accepted
date: 2026-10-22
---
# ADR-043 Download and delete my data

See [[Your Data, Dashboard and Care#1. Download my data and delete my account]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Export format | PDF; CSV per table; **one JSON file** | JSON | Complete and machine-readable (PDPL "portability"); easy to build. |
| What's in it | Everything incl. other people's messages; **my data only** | My data | Other people's messages are their data. |
| ID numbers | Full; **last 4 digits** | Last 4 | Unc never stores the full number anyway. |
| Deleting | At once; **after 7 days, with "Keep my account"** | 7 days | Protects against mistakes and stolen sessions; short enough to be honest. |
| What happens to chats/deals | Delete them; **keep them for the other person, as "Deleted member"** | Keep | The other person's history and ratings still make sense. |
| What is wiped | Only the profile; **identity documents, photos, profile, settings, notifications** | All personal | That's the point of deleting. |
| Banned members | Forget them too; **keep only their ID fingerprint** | Keep fingerprint | Stops "delete and come back" after a ban, without keeping documents. |
| Admins | Allowed; **not from the website** | Not allowed | Avoids locking the site out of its only admin. |

**Revisit when:** a lawyer reviews PDPL retention (e.g. deal records for N years), or members ask for a shorter/longer wait.
