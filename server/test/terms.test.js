// The Terms (session 40): agreed at sign-up; older members agree once
// before they can post, offer or answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();

test('signing up needs the Terms to be accepted', async () => {
  const body = { email: 'noterms@test.local', password: 'Password123', displayName: 'No Terms', accountType: 'individual' };
  await t.request(t.app).post('/api/auth/register').send(body).expect(400, /Terms/);
  await t.request(t.app).post('/api/auth/register').send({ ...body, acceptTerms: 'yes' }).expect(400);
  const res = await t.request(t.app).post('/api/auth/register').send({ ...body, acceptTerms: true }).expect(201);
  assert.equal(res.body.user.termsAccepted, true);
});

test('a member who joined before the Terms must accept them before posting or offering', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a lamp, terms test' });
  t.db.prepare('UPDATE users SET terms_version = 0 WHERE id = ?').run(seller.id); // an older account
  assert.equal((await seller.get('/api/auth/me')).body.user.termsAccepted, false);
  await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(403, /Terms/);
  await seller.post('/api/auth/terms').send({ accept: false }).expect(400);
  assert.equal((await seller.post('/api/auth/terms').send({ accept: true }).expect(200)).body.user.termsAccepted, true);
  await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201);
});
