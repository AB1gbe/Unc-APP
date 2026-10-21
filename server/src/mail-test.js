// Sends one test email using your current settings, so you can check your
// email setup without clicking through the app.
//
//   npm run mail:test -- you@example.com
//
// See docs/Features/Email Sending.md
import { config } from './config.js';
import { sendMail } from './lib/mailer.js';

const to = process.argv[2];
if (!to || !to.includes('@')) {
  console.error('Usage: npm run mail:test -- you@example.com');
  process.exit(1);
}

const { transport, from, smtp } = config.mail;
console.log(`Transport: ${transport}`);
if (transport === 'smtp') console.log(`SMTP:      ${smtp.host}:${smtp.port} (secure=${smtp.secure}) as ${smtp.user || '(no login)'}`);
console.log(`From:      ${from}`);
console.log(`To:        ${to}\n`);
if (transport === 'console') {
  console.log('Note: MAIL_TRANSPORT is "console", so the email is only printed below, not sent.');
  console.log('Set MAIL_TRANSPORT=smtp (or resend) in .env to really send it.\n');
}

try {
  await sendMail({
    to,
    subject: 'Unc test email',
    text: `If you can read this, Unc can send email.\n\nSent at ${new Date().toISOString()} via ${transport}.`,
    html: `<p>If you can read this, <b>Unc can send email</b>.</p><p style="color:#5d6573">Sent at ${new Date().toISOString()} via ${transport}.</p>`,
  });
  console.log(transport === 'console' ? 'Done (printed only).' : 'Sent! Check the inbox (and the spam folder).');
} catch (err) {
  console.error(`FAILED: ${err.message}`);
  if (/Invalid login|535|Username and Password not accepted/i.test(err.message)) {
    console.error('-> Wrong SMTP_USER / SMTP_PASS. For Gmail you need an App Password, not your normal password.');
  } else if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ESOCKET/i.test(err.message)) {
    console.error('-> Could not reach the mail server. Check SMTP_HOST / SMTP_PORT, or try port 465 with SMTP_SECURE=true.');
  }
  process.exit(1);
}
