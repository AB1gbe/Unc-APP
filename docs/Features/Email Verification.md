---
tags: [feature, auth]
---
# Email Verification

**Where:** `server/src/routes/auth.js` (`issueEmailCode`, `/verify-email`, `/resend-code`), `server/src/lib/mailer.js`, `client/src/pages/VerifyEmail.jsx`.

- On register a 6-digit code is generated (`crypto.randomInt`), stored as a peppered hash, valid **15 minutes**, **5 attempts**.
- **Development:** the code is printed in the server terminal (`[mail] Your code is 123456`) and shown on the page (`devCode`). In production `devCode` is never sent.
- Email must be verified before KYC.

## Switching to real email
Pick a provider (Resend, Postmark, Amazon SES, SendGrid). Example with Resend:
```bash
npm install resend --workspace server
```
```js
// server/src/lib/mailer.js
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
export async function sendMail(to, subject, text) {
  if (config.isTest) return;
  if (!config.isProd) return console.log(`[mail] to=${to} ${text}`);
  await resend.emails.send({ from: 'Unc <no-reply@yourdomain.com>', to, subject, text });
}
```
You must verify your sending domain with the provider (DNS records) first. Add `RESEND_API_KEY` to [[Environment Variables]].
