# Unc — ask for it, get offers

A **reverse marketplace**: buyers post what they want, and **identity-verified** shops and freelancers contact them privately **about that specific request**.

- ✅ KYC: email code → government ID + selfie (+ business documents) → admin review
- ✅ Simple, responsive design (desktop + mobile, light + dark)
- ✅ Messaging only exists inside a request: no free-form DMs (enforced in DB, API and UI)
- ✅ Password reset by email, real email via any SMTP provider or Resend

## Quick start
Requires **Node.js 22.13+** and Git. Works the same in Windows Command Prompt.
```bash
git clone https://github.com/AB1gbe/Unc-APP.git
cd Unc-APP
npm install
npm run seed    # optional demo data
npm run dev     # http://localhost:5173  (admin: admin@unc.local / ChangeMe123!)
npm test        # API tests
```
Optional settings (real email, admin password…): copy `.env.example` to `.env`. See `docs/Features/Email Sending.md`.

## Documentation
Everything — how it was built, why, every option and mistake — is in the **Obsidian vault in [`docs/`](docs/00%20Home.md)**. Open the `docs` folder as a vault in [Obsidian](https://obsidian.md) and start at **00 Home**.
