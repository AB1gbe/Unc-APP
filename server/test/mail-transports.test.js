// Proves the two REAL transports work: SMTP (against a local fake SMTP
// server) and Resend (with fetch replaced by a fake).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.js'; // sets test env before config loads
import { SMTPServer } from 'smtp-server';

const { config } = await import('../src/config.js');
const { sendMail, trySendMail, resetSmtpTransport } = await import('../src/lib/mailer.js');
const { passwordResetEmail } = await import('../src/lib/emails.js');

const received = [];
const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onData(stream, session, cb) {
    let raw = '';
    stream.on('data', (c) => { raw += c; });
    stream.on('end', () => { received.push({ to: session.envelope.rcptTo.map((r) => r.address), raw }); cb(); });
  },
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
after(() => server.close());

test('smtp transport delivers a real email', async () => {
  config.mail.transport = 'smtp';
  config.mail.smtp = { host: '127.0.0.1', port: server.server.address().port, secure: false, user: undefined, pass: undefined };
  resetSmtpTransport();
  await sendMail({ to: 'someone@example.com', ...passwordResetEmail('abc123') });
  assert.equal(received.length, 1);
  assert.deepEqual(received[0].to, ['someone@example.com']);
  assert.match(received[0].raw, /Subject: Reset your Unc password/);
  assert.match(received[0].raw, /reset-password\?token=3Dabc123|reset-password\?token=abc123/);
});

test('smtp failures are reported, and trySendMail swallows them', async () => {
  config.mail.smtp = { host: '127.0.0.1', port: 1, secure: false };
  resetSmtpTransport();
  await assert.rejects(sendMail({ to: 'x@example.com', subject: 's', text: 't' }));
  assert.equal(await trySendMail({ to: 'x@example.com', subject: 's', text: 't' }), false);
});

test('resend transport calls the Resend API with the key', async () => {
  config.mail.transport = 'resend';
  config.mail.resendApiKey = 're_test_key';
  const realFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, opts) => { calls.push({ url, opts }); return new Response('{"id":"1"}', { status: 200 }); };
  try {
    await sendMail({ to: 'someone@example.com', subject: 'Hi', text: 'Hello', html: '<p>Hello</p>' });
    assert.equal(calls[0].url, 'https://api.resend.com/emails');
    assert.equal(calls[0].opts.headers.Authorization, 'Bearer re_test_key');
    assert.deepEqual(JSON.parse(calls[0].opts.body).to, ['someone@example.com']);

    globalThis.fetch = async () => new Response('domain not verified', { status: 403 });
    await assert.rejects(sendMail({ to: 'a@b.co', subject: 's', text: 't' }), /403/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
