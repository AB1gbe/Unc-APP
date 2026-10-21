---
tags: [decision, privacy]
status: accepted
date: 2026-10-21
---
# ADR-026 Activity ("Active now", reply time, views) and privacy

See [[Social Touches#3. "Active now", reply time, "people looked at it"]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| Who sees "Active now" | Everyone; **logged-in members only**; nobody | Members | Signals there's a real person, without letting strangers track someone. |
| How exact | Exact time; **"Active now" (5 min) / "Active 2 hours ago" / nothing after a week** | Rough | Enough to set expectations, and less revealing. |
| Writing last-seen | On every request; **at most once a minute** | Once a minute | The chat polls every 4 seconds; no write storm. |
| Reply time | Average; **median of the newest 50 conversations, at least 3** | Median, ≥3 | One very slow reply doesn't ruin it; no label from a single chat. |
| "Seen by" | Count every page view; **each logged-in member once; never the buyer; shown only to the buyer** | Distinct | Honest numbers; no "who viewed you" list (see the never list in [[Social Marketplace Ideas]]). |
| Opting out | Switch in Account; **none yet** | None | Kept simple for now. |

## Revisit when
- Before a public launch: add "Hide my activity" in Account (the Bahrain PDPL privacy law asks for transparency and choice).
