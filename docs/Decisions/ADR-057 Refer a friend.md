---
tags: [decision, growth]
status: accepted
date: 2026-11-08
---
# ADR-057 Refer a friend

See [[Orders, Wallet, Invites and Video#2. Refer a friend]].

| Question | Options | Chosen | Why |
|---|---|---|---|
| When to reward | At sign-up; after the first deal; **once fully verified (email, identity check, card)** | Fully verified | Fake accounts can't pass KYC twice with one ID, so credit can't be farmed. A first-deal rule would be slower to feel. |
| Who gets credit | Inviter only; **both** | Both | A reason for the friend to use the link. |
| How much | **BD 1.000 inviter, BD 0.500 friend** (Unc credit) | Small | Credit isn't money yet; easy to change in `referrals.js`. |
| What the inviter sees | Names; **counts only** | Counts | Privacy: joining Unc is the friend's business. |
| The code | The member id; **a random 8-letter code (no 0/O, 1/I)** | Random | Ids can be guessed; letters are easy to read out. |
| The link's address | The server's `APP_URL`; **the address the page is open at** | Page address | Works on a phone test address too ([[Mistakes and Fixes#M108]]). |
| Unknown codes | Refuse sign-up; **ignore** | Ignore | A wrong link shouldn't stop someone joining. |

**Revisit when:** Unc earns money (real rewards, limits per month), or invites are abused.
