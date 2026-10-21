---
tags: [decision, messaging]
status: accepted
date: 2026-10-21
---
# ADR-007 Real-time chat updates: polling

## Options considered
| Option | Pros | Cons |
|---|---|---|
| WebSockets (Socket.IO / ws) | Instant | Extra server code, sticky sessions/proxies when deploying, reconnect handling |
| Server-Sent Events | Simpler than WebSockets, one-way push | Still long-lived connections; some hosts time them out |
| Firebase / Pusher / Ably | Hosted real-time | Third-party cost + second data store |
| **Polling** ✅ | Dead simple, works on every host, easy to debug | Up to 4 s delay; some wasted requests |

## Decision
- Open conversation polls `GET /api/conversations/:id?after=<lastMessageId>` every **4 s** — only new messages come back, so it's cheap.
- Header unread badge polls every **15 s**, plus instantly on page change and when a conversation is opened (custom browser event `unc:read`).

**Session 05:** polling now pauses while the browser tab is hidden (`usePolling` in `client/src/hooks.js`), and a chat poll only writes to the database when there is something to mark read. See [[ADR-013 Performance]].

## Revisit when
Hundreds of simultaneous chats → switch the conversation page to Server-Sent Events. The `after=` API already fits a push model.
