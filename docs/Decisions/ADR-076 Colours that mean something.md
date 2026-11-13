---
tags: [decision, design]
status: accepted
date: 2026-11-13
---
# ADR-076 Colours that mean something

The owner: **"Anything to do with selling: apply the correct corresponding colour. A positive thing relating to selling or buying should be green, a negative one should be red. COLOURS ARE SUPPOSED TO CONVEY WHAT TO DO WITHOUT READING."**

| Colour | Means | Used on |
|---|---|---|
| **Green** `--ok` #15803d (`.btn.ok`) | A positive buying/selling step | Sell, Post an ad (side bar, lists), the centre **+** tab, Post ad / Post request, Send offer, Send message (reply to an ad), Accept, Sold / Rented / Job filled, I found it, Raise (budget), I've paid / Received, Suggest / Accept a payment plan, Approve (admin) |
| **Red** `--bad` #c62828 (`.btn.danger`, `.btn.danger-outline`, `.bad-link`) | A negative step | Close ad, Close without buying, Not for me (decline an offer), Decline a payment plan, Remove (admin), Reject, Delete my account, Report, Block |
| **Blue** `--brand` #1f5fd6 | Neutral step, or "you are here" | Search, Log in, Sign up, Save, links, the selected chip, section and tab |
| **Red** (also) `--warn` = `--bad` | Warnings, be careful (session 87) | Safety lines ("Never pay a deposit…"), scam warnings in the posting form and chat, "This ad will be checked", "Closes in N days", big-deal and contact-sharing notes, confirm-email and verification prompts |
| **Yellow** `--accent` | Only the logo dot | |
| **Grey / white** | Everything else | Edit, Counter, Cancel, Share, sample notes, "Away" status |

Session 87 also moved things that were yellow but are not warnings: the **Rate** reminder and wallet earnings are **green** (`.badge.todo`, good things to do), tips are **blue**, sample notes and "Away" are **grey**.

Solid red only where the step can't be undone (Remove, Reject, Delete); otherwise red outline. ADR-074's yellow main actions are replaced by green.

**Revisit when:** a new kind of button is added: pick its colour from this table.

**Session 87 change:** the owner: "NO, WARNING SHOULD BE RED, again things are to be understood without reading." `--warn` now equals the red `--bad`.
