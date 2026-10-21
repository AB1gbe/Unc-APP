---
tags: [setup, deploy]
---
# Deploying to Production

The app is **one Node process**: the API also serves the built React site. So any host that runs Node and keeps a **persistent disk** works.

## Checklist before going live
- [ ] `NODE_ENV=production`
- [ ] `SECRET_PEPPER` set to a long random value (and stored somewhere safe)
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` set to real values
- [ ] HTTPS in front (hosts below do this automatically) — cookies are `secure` in production
- [ ] `DATA_DIR` on a **persistent volume**, with backups
- [ ] `MAIL_TRANSPORT=smtp` or `resend` + `MAIL_FROM` on a domain with SPF/DKIM set up → [[Email Sending]]
- [ ] `APP_URL=https://yourdomain.com` (otherwise reset links point to localhost)
- [ ] Decide on KYC: keep manual review, or plug in a provider → [[KYC Verification]]
- [ ] Privacy policy + terms (KYC data is sensitive personal data; GDPR/CCPA apply)

## Generic steps (any VPS or platform)
```bash
git clone -b claude/vibrant-edison-r9o798 https://github.com/AB1gbe/Unc-APP.git && cd Unc-APP   # or main once merged
npm ci                 # exact versions from package-lock.json
npm run build          # builds client/dist
cp .env.example .env   # then fill in the production values
npm start
```

## Example: Render.com
1. New → *Web Service* → connect the GitHub repo.
2. Build command: `npm ci && npm run build` · Start command: `npm start`
3. Add a **Disk** mounted at `/var/data` and set `DATA_DIR=/var/data/unc`.
4. Add the environment variables above.

## When you outgrow this
- Many users / several servers → move to PostgreSQL ([[ADR-003 Database]]) and S3-style file storage ([[ADR-008 File storage]]).
