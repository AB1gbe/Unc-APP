import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { outbox } = await import('../src/lib/mailer.js');
const { db } = t;

const lastMailTo = (email) => outbox.filter((m) => m.to === email).at(-1);
const tokenFrom = (mail) => new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get('token');

async function requestReset(email) {
  const res = await t.request(t.app).post('/api/auth/forgot-password').send({ email }).expect(200);
  return res.body;
}

test('registration emails a verification code (text + html)', async () => {
  const u = await t.user('registered');
  const me = await u.get('/api/auth/me');
  const mail = lastMailTo(me.body.user.email);
  assert.ok(mail, 'an email was sent');
  assert.match(mail.subject, /verification code/);
  assert.match(mail.html, /<html[\s>]/);
});

test('forgot-password answers identically for unknown emails and sends nothing', async () => {
  const before = outbox.length;
  const unknown = await requestReset('nobody@nowhere.test');
  assert.equal(outbox.length, before);
  const u = await t.user();
  const email = (await u.get('/api/auth/me')).body.user.email;
  const known = await requestReset(email);
  assert.deepEqual(known, unknown);
  assert.equal(lastMailTo(email).subject, 'Reset your Unc password');
});

test('reset link sets a new password, logs out everywhere, and works only once', async () => {
  const u = await t.user();
  const email = (await u.get('/api/auth/me')).body.user.email;
  await requestReset(email);
  const token = tokenFrom(lastMailTo(email));
  assert.ok(token);

  await t.request(t.app).post('/api/auth/reset-password/check').send({ token }).expect(200);
  await t.request(t.app).post('/api/auth/reset-password').send({ token, password: 'short' }).expect(400);
  await t.request(t.app).post('/api/auth/reset-password').send({ token, password: 'NewPassword456' }).expect(200);

  // old session is gone, old password fails, new one works
  await u.get('/api/conversations').expect(401);
  await t.request(t.app).post('/api/auth/login').send({ email, password: 'Password123' }).expect(401);
  await t.request(t.app).post('/api/auth/login').send({ email, password: 'NewPassword456' }).expect(200);
  assert.equal(lastMailTo(email).subject, 'Your Unc password was changed');

  // token can't be reused
  const again = await t.request(t.app).post('/api/auth/reset-password').send({ token, password: 'Another789xx' });
  assert.equal(again.status, 400);
  assert.equal(again.body.code, 'RESET_INVALID');
});

test('only the newest reset link works', async () => {
  const u = await t.user();
  const email = (await u.get('/api/auth/me')).body.user.email;
  await requestReset(email);
  const first = tokenFrom(lastMailTo(email));
  await requestReset(email);
  const second = tokenFrom(lastMailTo(email));
  await t.request(t.app).post('/api/auth/reset-password').send({ token: first, password: 'NewPassword456' }).expect(400);
  await t.request(t.app).post('/api/auth/reset-password').send({ token: second, password: 'NewPassword456' }).expect(200);
});

test('expired reset links are rejected', async () => {
  const u = await t.user();
  const email = (await u.get('/api/auth/me')).body.user.email;
  await requestReset(email);
  const token = tokenFrom(lastMailTo(email));
  db.prepare(`UPDATE password_resets SET expires_at = datetime('now', '-1 minute')`).run();
  await t.request(t.app).post('/api/auth/reset-password').send({ token, password: 'NewPassword456' }).expect(400);
});

test('a garbage token is rejected', async () => {
  await t.request(t.app).post('/api/auth/reset-password').send({ token: 'not-a-real-token', password: 'NewPassword456' }).expect(400);
});

test('the database stores only a hash of the reset token', async () => {
  const u = await t.user();
  const email = (await u.get('/api/auth/me')).body.user.email;
  await requestReset(email);
  const token = tokenFrom(lastMailTo(email));
  const rows = db.prepare('SELECT token_hash FROM password_resets').all();
  assert.ok(rows.every((r) => r.token_hash !== token));
});

test('change password needs the current one and keeps this device logged in', async () => {
  const u = await t.user();
  const email = (await u.get('/api/auth/me')).body.user.email;
  const other = t.request.agent(t.app);
  await other.post('/api/auth/login').send({ email, password: 'Password123' }).expect(200);

  const wrong = await u.post('/api/auth/change-password').send({ currentPassword: 'nope', password: 'NewPassword456' });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.body.field, 'currentPassword');

  await u.post('/api/auth/change-password').send({ currentPassword: 'Password123', password: 'NewPassword456' }).expect(200);
  await u.get('/api/conversations').expect(200);     // this device: still in
  await other.get('/api/conversations').expect(401); // other device: logged out
});
