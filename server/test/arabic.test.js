// Arabic on the server: error messages follow the request's language,
// members' language is stored, and emails go out in it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setup } from './helpers.js';

const t = await setup();
const { outbox } = await import('../src/lib/mailer.js');
const { translateMessage, _arabicMessages } = await import('../src/lib/i18n.js');
const AR = 'ar-BH,ar;q=0.9';
const arabic = /[؀-ۿ]/;

test('errors come back in Arabic when the request asks for Arabic', async () => {
  const en = await t.request(t.app).post('/api/auth/login').send({ email: 'nobody@x.test', password: 'whatever1' });
  assert.equal(en.body.error, 'Wrong email or password.');
  const ar = await t.request(t.app).post('/api/auth/login').set('Accept-Language', AR).send({ email: 'nobody@x.test', password: 'whatever1' });
  assert.equal(ar.status, 401);
  assert.equal(ar.body.error, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
});

test('validation messages use readable field names in both languages', async () => {
  const u = await t.user('email');
  const send = (lang) => u.post('/api/kyc').set('Accept-Language', lang).field('legalName', '');
  const en = await send('en');
  assert.equal(en.body.error, 'Full legal name is required.');
  assert.equal(en.body.field, 'legalName'); // the UI still gets the field key
  const ar = await send(AR);
  assert.equal(ar.body.error, 'الاسم الكامل مطلوب.');
});

test('upload and permission errors are translated too', async () => {
  const res = await t.request(t.app).get('/api/conversations').set('Accept-Language', AR);
  assert.equal(res.status, 401);
  assert.match(res.body.error, arabic);
  const bad = await t.request(t.app).post('/api/auth/login').set('Accept-Language', AR).set('Content-Type', 'application/json').send('{"email":');
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, arabic);
});

test('every exact server message has an Arabic version, and every message thrown in code is covered', () => {
  const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
  const files = fs.readdirSync(src, { recursive: true }).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(src, f), 'utf8').replace(/^\s*\/\/.*$/gm, ''));  // skip comment lines
  const literal = /(?:HttpError\(\d{3}, |notFound\()'((?:[^'\\]|\\.)*)'|(?:HttpError\(\d{3}, )"([^"]*)"/g;
  const missing = [];
  for (const code of files) {
    for (const m of code.matchAll(literal)) {
      const msg = (m[1] ?? m[2]).replace(/\\(.)/g, '$1');
      if (!arabic.test(translateMessage(msg, 'ar'))) missing.push(msg);
    }
  }
  assert.deepEqual(missing, []);
  for (const [en, ar] of Object.entries(_arabicMessages)) assert.match(ar, arabic, en);
});

test('a member signing up in Arabic is stored as Arabic and gets Arabic emails', async () => {
  const res = await t.request(t.app).post('/api/auth/register').set('Accept-Language', AR).send({
    email: 'arabic@test.local', password: 'Password123', displayName: 'Sara', accountType: 'individual', acceptTerms: true,
  }).expect(201);
  assert.equal(res.body.user.language, 'ar');
  const mail = outbox.filter((m) => m.to === 'arabic@test.local').at(-1);
  assert.match(mail.subject, /رمز التحقق/);
  assert.match(mail.html, /dir="rtl"/);
  assert.match(mail.html, /lang="ar"/);
});

test('switching language while logged in changes the emails, and only allows en/ar', async () => {
  const u = await t.user();
  const email = (await u.get('/api/auth/me')).body.user.email;
  await u.put('/api/auth/language').send({ language: 'fr' }).expect(400);
  const r = await u.put('/api/auth/language').send({ language: 'ar' }).expect(200);
  assert.equal(r.body.user.language, 'ar');
  await t.request(t.app).post('/api/auth/forgot-password').send({ email }).expect(200);
  const mail = outbox.filter((m) => m.to === email).at(-1);
  assert.match(mail.subject, /إعادة تعيين كلمة المرور/);
  assert.match(mail.text, /reset-password\?token=/); // the link itself is unchanged
  await t.request(t.app).put('/api/auth/language').send({ language: 'ar' }).expect(401); // logged out: not saved
});

test('the forgot-password notice is translated', async () => {
  const res = await t.request(t.app).post('/api/auth/forgot-password').set('Accept-Language', AR).send({ email: 'x@y.test' }).expect(200);
  assert.match(res.body.message, arabic);
});

test('accounts without a chosen language have none (null) and get English emails', async () => {
  const me = (await t.admin.get('/api/auth/me').expect(200)).body.user;
  assert.equal(me.language, null); // the admin never chose: the website keeps the browser's language
  const { verificationCodeEmail } = await import('../src/lib/emails.js');
  assert.match(verificationCodeEmail('123456', null).subject, /verification code/);
});
