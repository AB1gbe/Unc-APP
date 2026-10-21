import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, PNG } from './helpers.js';

const t = await setup();

test('unverified users cannot post requests', async () => {
  for (const stage of ['registered', 'email', 'pending']) {
    const u = await t.user(stage);
    const res = await u.post('/api/listings').send({ title: 'Need a thing', description: 'A thing please', category: 'Other', city: 'Austin' });
    assert.equal(res.status, 403, stage);
  }
});

test('KYC requires a verified email first', async () => {
  const u = await t.user('registered');
  const res = await t.kyc(u);
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'EMAIL_UNVERIFIED');
});

test('wrong email code is rejected and attempts are limited', async () => {
  const u = await t.user('registered');
  for (let i = 0; i < 5; i++) await u.post('/api/auth/verify-email').send({ code: '000000' }).expect(400);
  await u.post('/api/auth/verify-email').send({ code: '000000' }).expect(429);
});

test('under-18 applicants are rejected', async () => {
  const u = await t.user('email');
  const res = await t.kyc(u, { dateOfBirth: new Date().toISOString().slice(0, 10) });
  assert.equal(res.status, 400);
  assert.equal(res.body.field, 'dateOfBirth');
});

test('non-image uploads are rejected even with an image filename', async () => {
  const u = await t.user('email');
  const res = await u.post('/api/kyc')
    .field('legalName', 'Test Person').field('dateOfBirth', '1990-01-01').field('country', 'US')
    .field('idType', 'passport').field('idNumber', 'P999999')
    .attach('docFront', Buffer.from('<script>alert(1)</script>'), 'evil.png')
    .attach('selfie', PNG, 's.png');
  assert.equal(res.status, 400);
});

test('the same ID document cannot verify two accounts', async () => {
  const a = await t.user('email');
  const b = await t.user('email');
  await t.kyc(a, { idNumber: 'DUP-1234' }).expect(201);
  const res = await t.kyc(b, { idNumber: 'dup 1234' }); // normalised: same number
  assert.equal(res.status, 409);
});

test('business accounts must upload a business document', async () => {
  const u = await t.user('email', 'business');
  const res = await t.kyc(u, { businessName: 'Shop Ltd', businessRegNumber: 'REG1' });
  assert.equal(res.status, 400);
  assert.equal(res.body.field, 'businessDoc');
});

test('rejected users can resubmit; admin approval unlocks posting', async () => {
  const u = await t.user('email');
  const first = await t.kyc(u, { idNumber: 'RS-0001' }).expect(201);
  await t.admin.post(`/api/admin/kyc/${first.body.submission.id}/decision`).send({ decision: 'rejected', note: 'Photo blurry' }).expect(200);
  const status = await u.get('/api/kyc').expect(200);
  assert.equal(status.body.kycStatus, 'rejected');
  assert.equal(status.body.submission.reviewNote, 'Photo blurry');

  const second = await t.kyc(u, { idNumber: 'RS-0001' }).expect(201);
  await t.admin.post(`/api/admin/kyc/${second.body.submission.id}/decision`).send({ decision: 'approved' }).expect(200);
  await t.listing(u);
});

test('KYC files are private: only admins can fetch them', async () => {
  const u = await t.user('pending');
  const { body } = await t.admin.get('/api/admin/kyc?status=pending').expect(200);
  const id = body.submissions.at(-1).id;
  await t.admin.get(`/api/admin/kyc/${id}/file/selfie`).expect(200);
  await u.get(`/api/admin/kyc/${id}/file/selfie`).expect(403);
  await t.request(t.app).get(`/api/admin/kyc/${id}/file/selfie`).expect(401);
});

test('full ID numbers are never returned', async () => {
  const u = await t.user('pending');
  const own = await u.get('/api/kyc').expect(200);
  const { body } = await t.admin.get(`/api/admin/kyc/${own.body.submission.id}`).expect(200);
  const text = JSON.stringify([own.body, body]);
  assert.ok(!text.includes('id_number_hash'));
  assert.equal(own.body.submission.idNumberLast4.length, 4);
});
