// Regression tests for the bugs found in the session-05 code review.
// Each test reproduces the original failure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { setup, PNG } from './helpers.js';

const t = await setup();
const { outbox } = await import('../src/lib/mailer.js');
const { KYC_DIR, LISTING_DIR } = await import('../src/lib/uploads.js');
const { db } = t;
const emailOf = async (a) => (await a.get('/api/auth/me')).body.user.email;
const filesIn = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).length : 0);

test('parallel KYC uploads create only one pending submission', async () => {
  const u = await t.user('email');
  // Big files so the three uploads are still streaming in at the same time,
  // like a retry on a slow phone connection.
  const big = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)]);
  const upload = () => u.post('/api/kyc')
    .field('legalName', 'Test Person').field('dateOfBirth', '1990-05-01').field('country', 'US')
    .field('idType', 'passport').field('idNumber', 'PAR-1234')
    .attach('docFront', big, 'f.png').attach('selfie', big, 's.png');
  const results = await Promise.all([upload(), upload(), upload()]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409]);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM kyc_submissions WHERE user_id = ?').get(u.id).n, 1);
});

test('reviewing an older submission cannot override the newest decision', async () => {
  const u = await t.user('email');
  const first = (await t.kyc(u, { idNumber: 'OLD-0001' }).expect(201)).body.submission.id;
  await t.admin.post(`/api/admin/kyc/${first}/decision`).send({ decision: 'rejected', note: 'blurry' }).expect(200);
  const second = (await t.kyc(u, { idNumber: 'OLD-0001' }).expect(201)).body.submission.id;
  await t.admin.post(`/api/admin/kyc/${second}/decision`).send({ decision: 'approved' }).expect(200);
  // simulate a stale pending row (as the old race could create) being decided late
  db.prepare(`UPDATE kyc_submissions SET status = 'pending' WHERE id = ?`).run(first);
  await t.admin.post(`/api/admin/kyc/${first}/decision`).send({ decision: 'rejected', note: 'dup' }).expect(200);
  assert.equal((await u.get('/api/kyc')).body.kycStatus, 'approved');
});

test('a bad file in a KYC upload leaves no ID photos behind', async () => {
  const u = await t.user('email');
  const before = filesIn(KYC_DIR());
  const res = await u.post('/api/kyc')
    .field('legalName', 'Test Person').field('dateOfBirth', '1990-01-01').field('country', 'US')
    .field('idType', 'passport').field('idNumber', 'P-ORPHAN-1')
    .attach('docFront', PNG, 'front.png')
    .attach('selfie', Buffer.from('not an image'), 'selfie.png');
  assert.equal(res.status, 400);
  assert.equal(filesIn(KYC_DIR()), before);
});

test('a bad photo means no listing is created at all', async () => {
  const u = await t.user();
  const before = db.prepare('SELECT COUNT(*) n FROM listings').get().n;
  const photosBefore = filesIn(LISTING_DIR());
  const res = await u.post('/api/listings')
    .field('title', 'Looking for a camera').field('description', 'Any decent camera').field('category', 'Electronics').field('city', 'Austin')
    .attach('images', PNG, 'ok.png')
    .attach('images', Buffer.from('nope'), 'bad.png');
  assert.equal(res.status, 400);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM listings').get().n, before);
  assert.equal(filesIn(LISTING_DIR()), photosBefore);
});

test('upload and JSON mistakes return 4xx, not 500', async () => {
  const u = await t.user();
  let req = u.post('/api/listings').field('title', 'Looking for a camera').field('description', 'Any decent camera')
    .field('category', 'Electronics').field('city', 'Austin');
  for (let i = 0; i < 4; i++) req = req.attach('images', PNG, `${i}.png`);
  assert.equal((await req).status, 400); // 4 photos (max 3)
  assert.equal((await u.post('/api/listings').attach('surprise', PNG, 'x.png')).status, 400); // unknown field
  const bad = await t.request(t.app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
  assert.equal(bad.status, 400);
});

test('banned buyers: their requests disappear and nobody can start or continue chats with them', async () => {
  const buyer = await t.user();
  const vendor = await t.user();
  const other = await t.user();
  const l = await t.listing(buyer);
  const conv = (await vendor.post(`/api/listings/${l.id}/contact`).send({ message: 'hi' }).expect(201)).body.conversation;
  await t.admin.post(`/api/admin/users/${buyer.id}/ban`).send({ banned: true }).expect(200);

  await other.get(`/api/listings/${l.id}`).expect(404);
  await other.post(`/api/listings/${l.id}/contact`).send({ message: 'hello' }).expect(404);
  await vendor.post(`/api/conversations/${conv.id}/messages`).send({ message: 'still there?' }).expect(409);
  await t.admin.get(`/api/listings/${l.id}`).expect(200); // admins can still see it
});

test('unban only accepts a real boolean ("false" as text must not ban)', async () => {
  const u = await t.user();
  await t.admin.post(`/api/admin/users/${u.id}/ban`).send({ banned: 'false' }).expect(400);
  await u.get('/api/conversations').expect(200); // still logged in, not banned
});

test('two simultaneous sign-ups with one email: one 201, one 409 (no 500)', async () => {
  const body = { email: 'race@test.local', password: 'Password123', displayName: 'Racer', accountType: 'individual' };
  const results = await Promise.all([1, 2].map(() => t.request(t.app).post('/api/auth/register').send(body)));
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
});

test('a reset link clicked twice at once only works once', async () => {
  const u = await t.user();
  const email = await emailOf(u);
  await t.request(t.app).post('/api/auth/forgot-password').send({ email }).expect(200);
  const mail = outbox.filter((m) => m.to === email).at(-1);
  const token = new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get('token');
  const results = await Promise.all(['NewPassword111', 'NewPassword222'].map((password) =>
    t.request(t.app).post('/api/auth/reset-password').send({ token, password })));
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
});

test('a huge page number is handled, not a 500', async () => {
  await t.request(t.app).get('/api/listings?page=999999999999999999999').expect(200);
});

test('impossible dates like 31 February are rejected', async () => {
  const u = await t.user();
  const res = await u.post('/api/listings').send({
    title: 'Looking for a tent', description: 'Two person tent', category: 'Sports & Outdoors', city: 'Austin', neededBy: '2026-02-31',
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.field, 'neededBy');
});

test('a vendor can still open a closed request they talked about; strangers cannot', async () => {
  const buyer = await t.user();
  const vendor = await t.user();
  const stranger = await t.user();
  const l = await t.listing(buyer);
  await vendor.post(`/api/listings/${l.id}/contact`).send({ message: 'hi' }).expect(201);
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'fulfilled' }).expect(200);
  await vendor.get(`/api/listings/${l.id}`).expect(200);
  await stranger.get(`/api/listings/${l.id}`).expect(404);
});

test('the app trusts the configured number of proxies', () => {
  assert.equal(t.app.get('trust proxy'), 0);
});
