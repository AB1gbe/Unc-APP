// Central place for every setting. Values come from environment variables
// so nothing secret is ever hard-coded. See docs/Setup/Environment Variables.md
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, '..');

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

if (isProd && !process.env.SECRET_PEPPER) {
  throw new Error('SECRET_PEPPER must be set in production');
}

const dataDir = process.env.DATA_DIR || path.join(serverRoot, 'data');

// How email leaves the server: 'console' (print it, dev only), 'smtp'
// (any provider: Gmail, Resend, Postmark, SES, Mailgun...) or 'resend'
// (Resend's HTTP API). See docs/Features/Email Sending.md
// Tests always use 'memory' so a real .env can never make tests send email.
const mailTransport = isTest ? 'memory' : process.env.MAIL_TRANSPORT || 'console';
if (isProd && ['console', 'memory'].includes(mailTransport)) {
  throw new Error('In production set MAIL_TRANSPORT to smtp or resend so emails are really sent');
}

export const config = {
  isProd,
  isTest,
  port: Number(process.env.PORT || 4000),
  // How many proxies sit in front of the app (Render/Railway/Fly/nginx: 1).
  // Needed so rate limits see each visitor's real IP. Leave 0 when the app
  // is reached directly (local development).
  trustProxy: /^\d+$/.test(process.env.TRUST_PROXY || '') ? Number(process.env.TRUST_PROXY) : (process.env.TRUST_PROXY || 0),
  dataDir,
  dbFile: process.env.DB_FILE || path.join(dataDir, 'unc.sqlite'),
  uploadDir: path.join(dataDir, 'uploads'),
  // The built website. CLIENT_DIST lets tests point at a small stand-in.
  clientDist: process.env.CLIENT_DIST || path.resolve(serverRoot, '..', 'client', 'dist'),
  // Pepper is mixed into hashes of ID numbers so a leaked DB alone can't be
  // brute-forced back into ID numbers.
  pepper: process.env.SECRET_PEPPER || 'dev-only-pepper-change-me',
  sessionDays: 14,
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@unc.local').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  kycProvider: process.env.KYC_PROVIDER || 'manual',
  // Payment cards (session 40): 'test' (showcase, no money moves) or 'tap'.
  paymentProvider: process.env.PAYMENT_PROVIDER || 'test',
  minAge: 18,
  // Public address of the website, used to build links inside emails.
  appUrl: (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  resetTokenMinutes: 30,
  mail: {
    transport: mailTransport,
    from: process.env.MAIL_FROM || 'Unc <no-reply@unc.local>',
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      // true = TLS from the first byte (port 465); false = STARTTLS upgrade (port 587)
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      // Google displays App Passwords in groups ("abcd efgh ijkl mnop");
      // remove the spaces so pasting it as shown still works.
      pass: process.env.SMTP_HOST === 'smtp.gmail.com'
        ? process.env.SMTP_PASS?.replace(/\s+/g, '')
        : process.env.SMTP_PASS,
    },
    resendApiKey: process.env.RESEND_API_KEY,
  },
  maxUploadBytes: 5 * 1024 * 1024,
  // Web Push (phone notifications). Keys are generated automatically when
  // these are empty; see docs/Features/Push Notifications.md. Apple only
  // accepts a real contact: an https:// address or mailto: with a real email.
  push: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT
      || (/^https:\/\//.test(process.env.APP_URL || '') ? process.env.APP_URL.replace(/\/+$/, '') : 'mailto:admin@unc.local'),
  },
};
