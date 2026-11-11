---
tags: [decision, design, navigation]
status: accepted
date: 2026-11-11
---
# ADR-066 Calm home page and tabs

The owner: "fill out these categories with examples" and "provide a more calm home page and apply a specified tab for all important things, like a tab for requests where you can find the requests of individuals".

| Question | Options | Chosen | Why |
|---|---|---|---|
| Empty categories in the demo | Leave empty; **2 example requests per category with real photos** | Examples | Every category shows what Unc is for; `server/src/demo-requests.js`. |
| Home page (visitors) | Everything on one page (session 72 before); **calm: banner, 4 shops, 4 categories, 3 newest requests** | Calm | Each part links to its own tab. |
| Tabs | Browse only; **Home · Requests · Shops · Categories** (+ My requests, Messages for members) | Tabs | The owner asked for a tab per important area. "Browse" is now called **Requests**. |
| Phones | Tab bar for members only; **visitors also get a tab bar (Home, Requests, Shops, Categories)** | Both | Visitors on phones could not reach the sections. |
| Where the rest went | — | Activity list → Requests tab; "Found on Unc" stories → Shops tab; member home keeps "Needs your attention", "Your open requests" and "Requests you could help with" | Calmer home pages. |
| Log out | Top bar and Account; **Account only** | Account | The member top bar was wrapping onto two lines. |

**Revisit when:** more sections need a tab (e.g. Orders), or the owner wants the activity list back on the home page.
