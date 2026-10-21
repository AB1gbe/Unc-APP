// Email sending. In development we just print to the console. To send real
// email, replace the body of sendMail with your provider's API call
// (e.g. Resend, Postmark, SES) - see docs/Features/Email Verification.md
import { config } from '../config.js';

export function sendMail(to, subject, text) {
  if (config.isTest) return;
  console.log(`\n[mail] to=${to}\n[mail] subject=${subject}\n[mail] ${text}\n`);
}
