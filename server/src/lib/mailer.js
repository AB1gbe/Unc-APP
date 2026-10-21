// Email sending. Which transport is used comes from MAIL_TRANSPORT
// (see config.js and docs/Features/Email Sending.md):
//
//   console -> print the email in the server terminal (development)
//   memory  -> keep it in `outbox` (automated tests read it from there)
//   smtp    -> send through any SMTP provider using nodemailer
//   resend  -> send through Resend's HTTP API
//
// sendMail() throws if the provider rejects the email; callers decide
// whether that should fail the request.
import nodemailer from 'nodemailer';
import { config } from '../config.js';

export const outbox = [];

let smtpTransport = null;
function smtp() {
  if (!smtpTransport) {
    const { host, port, secure, user, pass } = config.mail.smtp;
    if (!host) throw new Error('SMTP_HOST is not set');
    smtpTransport = nodemailer.createTransport({
      host, port, secure,
      auth: user ? { user, pass } : undefined,
    });
  }
  return smtpTransport;
}

async function sendViaResend(mail) {
  if (!config.mail.resendApiKey) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.mail.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: mail.from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
  });
  if (!res.ok) throw new Error(`Resend rejected the email (${res.status}): ${await res.text()}`);
}

export async function sendMail({ to, subject, text, html }) {
  const mail = { from: config.mail.from, to, subject, text, html };
  switch (config.mail.transport) {
    case 'memory':
      outbox.push(mail);
      return;
    case 'console':
      console.log(`\n[mail] to=${to}\n[mail] subject=${subject}\n${text}\n`);
      return;
    case 'smtp':
      await smtp().sendMail(mail);
      return;
    case 'resend':
      await sendViaResend(mail);
      return;
    default:
      throw new Error(`Unknown MAIL_TRANSPORT "${config.mail.transport}"`);
  }
}

// For places where a failed email must not break the request (e.g. the
// account is created even if the welcome code can't be sent - the user can
// press "send a new code").
export async function trySendMail(mail) {
  try {
    await sendMail(mail);
    return true;
  } catch (err) {
    console.error(`[mail] failed to send "${mail.subject}" to ${mail.to}:`, err.message);
    return false;
  }
}

// Used by tests to point the SMTP transport at a fake server.
export function resetSmtpTransport() {
  smtpTransport = null;
}
