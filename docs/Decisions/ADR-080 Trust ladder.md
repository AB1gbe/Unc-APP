---
tags: [decision, safety, onboarding]
status: accepted
date: 2026-11-15
---
# ADR-080 Trust ladder

From [[Honest Review 2026-11-15]] point 2 (sign-up too hard) and the owner's worry ("then scams would be easier"): [[2026-11-15 Session 100]]. The owner: **"Yes, build it, with email code for now."**

| Level | Needs | Can |
|---|---|---|
| Browse | nothing | look at everything |
| **Member** (`requireMember`) | confirmed email (code) + Terms | reply to For sale / Housing / Jobs ads, chat, accept/decline in chat; shown to others as **"Not ID-checked"** (red label) |
| **ID-checked** (`requireVerified`) | + ID check approved | post anything, make **offers on Wanted requests** (the seller side), payment plans |
| **Business** | + CR + payment card | as ID-checked, and pays for ads |

| Question | Options | Chosen | Why |
|---|---|---|---|
| ID check for everyone? | everyone; nobody; **where the money and trust are** | Where it matters | Scams mostly come from posters (fake flats, fake jobs, non-existent items); those still need the ID check. Replies carry less risk and chat already hides links/numbers and warns about scams. |
| Step 2 proof | **email code now**; Bahrain phone SMS code | Email now | Free and already built; switch to phone SMS (one account per number, stronger) when an SMS provider is chosen. |
| Card for people | keep; **drop** | Dropped | Only businesses pay; cards stay for them. Invite rewards now need email + ID check (+ card only for businesses). |

Extra protection for members without the ID check:
- at most **5 new chats a day** (`NEW_CHATS_PER_DAY` in `server/src/routes/conversations.js`; 429 after that);
- a red **"Not ID-checked"** label in chats;
- advertisers can choose **"Only ID-checked members"** (`contact_rule = 'verified'`, ads only).

**Revisit when:** an SMS provider is connected (phone code instead of or as well as email); if scam reports from members without the ID check go up (lower the daily limit, or require the ID check for Housing replies).
