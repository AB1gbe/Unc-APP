// Phone codes for casual sellers (session 102, ADR-082): a person selling
// their own things (For sale) or asking for something (Wanted) confirms a
// Bahrain mobile number by SMS instead of an ID check. Housing, Jobs and
// businesses still need the ID check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { smsOutbox } from '../src/lib/sms.js';
import { deleteNow } from '../src/lib/deletion.js';
import { normalizePhone, postNeeds } from '../../shared/trust.js';

const t = await setup();
let nextNumber = 36100000;
const newNumber = () => String((nextNumber += 1));

const sale = { section: 'forsale', title: 'Road bike, 54cm frame', description: 'Used road bike in good condition, recently serviced', category: 'Sports & Outdoors', price: 95, city: 'Manama', condition: 'used' };
const want = { title: 'Looking for a used PS5', description: 'With two controllers, good condition', category: 'Electronics', budgetMin: 100, budgetMax: 150, city: 'Juffair' };

async function confirmPhone(agent, number = newNumber()) {
  const sent = (await agent.post('/api/auth/phone').send({ phone: number }).expect(200)).body;
  return (await agent.post('/api/auth/phone/verify').send({ code: sent.devCode }).expect(200)).body.user;
}

test('Bahrain mobile numbers are recognised in the usual ways', () => {
  for (const n of ['36123456', '3612 3456', '+973 3612 3456', '00973-3612-3456', '97336123456', '٣٦١٢٣٤٥٦']) assert.equal(normalizePhone(n), '+97336123456', n);
  assert.equal(normalizePhone('66123456'), '+97366123456');
  for (const n of ['1712345', '17123456', '+971501234567', 'abc', '', null]) assert.equal(normalizePhone(n), null, String(n));
});

test('who needs what to post', () => {
  const person = { accountType: 'individual', kycStatus: 'unverified', phoneVerified: false, hasCard: false };
  assert.equal(postNeeds(person, 'forsale'), 'phone');
  assert.equal(postNeeds({ ...person, phoneVerified: true }, 'forsale'), null);
  assert.equal(postNeeds({ ...person, phoneVerified: true }, 'wanted'), null);
  assert.equal(postNeeds({ ...person, phoneVerified: true }, 'housing'), 'kyc');
  assert.equal(postNeeds({ ...person, phoneVerified: true }, 'jobs'), 'kyc');
  assert.equal(postNeeds({ ...person, kycStatus: 'approved' }, 'housing'), null);
  const shop = { accountType: 'business', kycStatus: 'unverified', phoneVerified: true, hasCard: false };
  assert.equal(postNeeds(shop, 'forsale'), 'kyc');
  assert.equal(postNeeds({ ...shop, kycStatus: 'approved' }, 'forsale'), 'card');
});

test('a person with only a confirmed email is asked for the phone code to sell, the ID check for housing', async () => {
  const p = await t.user('email');
  const r = await p.post('/api/listings').send(sale).expect(403);
  assert.equal(r.body.code, 'PHONE_REQUIRED');
  assert.equal((await p.post('/api/listings').send(want).expect(403)).body.code, 'PHONE_REQUIRED');
  assert.equal((await p.post('/api/listings').send({ section: 'housing', title: 'Room in a shared flat' }).expect(403)).body.code, 'KYC_REQUIRED');
  assert.equal((await p.post('/api/listings').send({ section: 'jobs', title: 'Barista' }).expect(403)).body.code, 'KYC_REQUIRED');
});

test('confirming a phone: text sent, wrong code refused, right code confirms; then For sale and Wanted work, Housing does not', async () => {
  const p = await t.user('email');
  await p.post('/api/auth/phone').send({ phone: '1712345' }).expect(400);
  const before = smsOutbox.length;
  const sent = (await p.post('/api/auth/phone').send({ phone: '3655 0001' }).expect(200)).body;
  assert.equal(sent.phone, '+973 •••• 0001');
  assert.equal(smsOutbox.length, before + 1);
  assert.equal(smsOutbox.at(-1).to, '+97336550001');
  assert.match(smsOutbox.at(-1).body, new RegExp(sent.devCode));
  const wrong = sent.devCode === '000000' ? '111111' : '000000';
  await p.post('/api/auth/phone/verify').send({ code: wrong }).expect(400);
  const user = (await p.post('/api/auth/phone/verify').send({ code: sent.devCode }).expect(200)).body.user;
  assert.equal(user.phoneVerified, true);
  assert.equal(user.phone, '+973 •••• 0001');
  // The code can't be used twice.
  await p.post('/api/auth/phone/verify').send({ code: sent.devCode }).expect(400);

  const ad = (await p.post('/api/listings').send(sale).expect(201)).body.listing;
  assert.equal(ad.buyer.idChecked, false);
  const req = (await p.post('/api/listings').send(want).expect(201)).body.listing;
  await p.patch(`/api/listings/${req.id}`).send({ ...want, title: 'Looking for a used PS5 Slim' }).expect(200);
  assert.equal((await p.post('/api/listings').send({ section: 'housing', title: 'Room in a shared flat' }).expect(403)).body.code, 'KYC_REQUIRED');
  // A public profile, marked as not ID-checked; the number is never shown.
  const member = (await t.request(t.app).get(`/api/members/${p.id}`).expect(200)).body.member;
  assert.equal(member.idChecked, false);
  assert.ok(!JSON.stringify(member).includes('36550001'));
  const listed = (await t.request(t.app).get(`/api/listings/${ad.id}`).expect(200)).body.listing;
  assert.ok(!JSON.stringify(listed).includes('36550001'));
});

test('one account per number', async () => {
  const a = await t.user('email');
  await confirmPhone(a, '36550002');
  const b = await t.user('email');
  await b.post('/api/auth/phone').send({ phone: '+973 3655 0002' }).expect(409);
});

test('a business still needs the ID check, phone or not', async () => {
  const shop = await t.user('email', 'business');
  await confirmPhone(shop);
  assert.equal((await shop.post('/api/listings').send(sale).expect(403)).body.code, 'KYC_REQUIRED');
});

test('5 wrong codes lock the code; at most 5 texts a day', async () => {
  const p = await t.user('email');
  const sent = (await p.post('/api/auth/phone').send({ phone: newNumber() }).expect(200)).body;
  const wrong = sent.devCode === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i += 1) await p.post('/api/auth/phone/verify').send({ code: wrong }).expect(400);
  await p.post('/api/auth/phone/verify').send({ code: sent.devCode }).expect(429);
  for (let i = 0; i < 4; i += 1) await p.post('/api/auth/phone').send({ phone: newNumber() }).expect(200);
  await p.post('/api/auth/phone').send({ phone: newNumber() }).expect(429);
});

test('phone codes need a confirmed email', async () => {
  const fresh = await t.user('registered');
  await fresh.post('/api/auth/phone').send({ phone: newNumber() }).expect(403);
});

test('deleting the account frees the number', async () => {
  const p = await t.user('email');
  await confirmPhone(p, '36550003');
  deleteNow(t.db, t.db.prepare('SELECT * FROM users WHERE id = ?').get(p.id));
  assert.equal(t.db.prepare('SELECT phone FROM users WHERE id = ?').get(p.id).phone, null);
  const q = await t.user('email');
  await confirmPhone(q, '36550003');
});
