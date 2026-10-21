// Phone push notifications for new offers (session 15). A fake sender
// records what would go to the push service; nothing leaves the machine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { setPushSender } = await import('../src/lib/push.js');
let sent = [];
let fail = null; // set to { statusCode } to make the push service refuse
setPushSender(async (sub, payload) => {
  if (fail) throw Object.assign(new Error('push service said no'), fail);
  sent.push({ endpoint: sub.endpoint, keys: sub.keys, ...JSON.parse(payload) });
});

let n = 0;
const device = () => ({ endpoint: `https://push.example.com/send/device-${++n}`, keys: { p256dh: 'BPublicKey_abc-123', auth: 'authSecret_9' } });
const tick = () => new Promise((r) => setImmediate(r));

test('the public key is available and stays the same', async () => {
  const a = (await t.request(t.app).get('/api/push/key').expect(200)).body.publicKey;
  const b = (await t.request(t.app).get('/api/push/key').expect(200)).body.publicKey;
  assert.match(a, /^[A-Za-z0-9_-]{80,}$/);
  assert.equal(a, b);
});

test('a new offer pushes to every device of the buyer, in their language, and not to the seller', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const phone = device();
  const laptop = device();
  await buyer.post('/api/push/subscribe').send(phone).expect(201);
  await buyer.post('/api/push/subscribe').send(laptop).expect(201);
  await seller.post('/api/push/subscribe').send(device()).expect(201);
  await buyer.put('/api/auth/language').send({ language: 'ar' }).expect(200);
  const l = await t.listing(buyer, { title: 'Need a desk lamp' });

  sent = [];
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201)).body.conversation;
  await tick();
  assert.deepEqual(sent.map((s) => s.endpoint).sort(), [phone.endpoint, laptop.endpoint].sort());
  assert.equal(sent[0].title, 'عرض جديد');
  assert.match(sent[0].body, /Need a desk lamp/);
  assert.match(sent[0].body, /User \d+/);
  assert.equal(sent[0].url, `/messages/${conv.id}`);
  assert.equal(sent[0].dir, 'rtl');
  assert.deepEqual(sent[0].keys, phone.keys);

  sent = [];
  await buyer.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Great, how much?' }).expect(201);
  await seller.post(`/api/conversations/${conv.id}/messages`).send({ message: '30' }).expect(201);
  await tick();
  assert.equal(sent.length, 0, 'only new offers push, not every message');
});

test('turning off, a device the push service has forgotten, and a shared device', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const other = await t.user();
  const phone = device();
  await buyer.post('/api/push/subscribe').send(phone).expect(201);
  await buyer.post('/api/push/unsubscribe').send({ endpoint: phone.endpoint }).expect(200);
  sent = [];
  await seller.post(`/api/listings/${(await t.listing(buyer)).id}/contact`).send({ message: 'Offer one' }).expect(201);
  await tick();
  assert.equal(sent.length, 0, 'turned off');

  // The push service says the device is gone (410): it is removed.
  await buyer.post('/api/push/subscribe').send(phone).expect(201);
  fail = { statusCode: 410 };
  await seller.post(`/api/listings/${(await t.listing(buyer)).id}/contact`).send({ message: 'Offer two' }).expect(201);
  await tick();
  fail = null;
  assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE endpoint = ?').get(phone.endpoint).n, 0);

  // A service error never breaks making the offer.
  await buyer.post('/api/push/subscribe').send(phone).expect(201);
  fail = { statusCode: 500 };
  await seller.post(`/api/listings/${(await t.listing(buyer)).id}/contact`).send({ message: 'Offer three' }).expect(201);
  await tick();
  fail = null;

  // Same browser, another member logs in and turns it on: it's theirs now.
  await other.post('/api/push/subscribe').send(phone).expect(201);
  const owner = t.db.prepare('SELECT user_id FROM push_subscriptions WHERE endpoint = ?').get(phone.endpoint).user_id;
  assert.equal(owner, other.id);
});

test('bad subscriptions, logged-out calls and the test button', async () => {
  const u = await t.user();
  await u.post('/api/push/subscribe').send({ endpoint: 'http://insecure.example.com/x', keys: device().keys }).expect(400);
  await u.post('/api/push/subscribe').send({ endpoint: 'not a url', keys: device().keys }).expect(400);
  await u.post('/api/push/subscribe').send({ ...device(), keys: { p256dh: 'has spaces!', auth: 'x' } }).expect(400);
  await t.request(t.app).post('/api/push/subscribe').send(device()).expect(401);

  await u.post('/api/push/test').expect(409);
  await u.post('/api/push/subscribe').send(device()).expect(201);
  sent = [];
  assert.equal((await u.post('/api/push/test').expect(200)).body.sent, 1);
  assert.equal(sent[0].title, 'Unc');
});
