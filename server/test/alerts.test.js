// Request alerts for sellers (session 31).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { setPushSender } = await import('../src/lib/push.js');
const pushed = [];
setPushSender(async (sub, payload) => { pushed.push({ endpoint: sub.endpoint, ...JSON.parse(payload) }); });
const alertsFor = async (a) => (await a.get('/api/notifications').expect(200)).body.notifications.filter((n) => n.kind === 'alert-match').map((n) => n.listing.title);

test('save, list and delete alerts; at least one field; at most 10', async () => {
  const s = await t.user();
  await s.post('/api/alerts').send({}).expect(400);
  await s.post('/api/alerts').send({ category: 'Not a category' }).expect(400);
  const a = (await s.post('/api/alerts').send({ q: 'ps5', category: 'Electronics', city: 'Manama', minBudget: 100 }).expect(201)).body.alert;
  assert.deepEqual([a.q, a.category, a.city, a.minBudget], ['ps5', 'Electronics', 'Manama', 100]);
  assert.equal((await s.get('/api/alerts').expect(200)).body.alerts.length, 1);
  for (let i = 0; i < 9; i++) await s.post('/api/alerts').send({ q: `word${i}` }).expect(201);
  await s.post('/api/alerts').send({ q: 'one too many' }).expect(400);
  await s.delete(`/api/alerts/${a.id}`).expect(200);
  await (await t.user()).delete(`/api/alerts/${a.id}`).expect(404);
  await t.request(t.app).get('/api/alerts').expect(401);
});

test('a new request reaches matching alerts only: words, category, city, budget', async () => {
  const buyer = await t.user();
  const make = async (alert) => { const s = await t.user(); await s.post('/api/alerts').send(alert).expect(201); return s; };
  const words = await make({ q: 'ps5 controller' });
  const cat = await make({ category: 'Electronics', city: 'manama' });
  const rich = await make({ minBudget: 100 });
  const wrongCity = await make({ category: 'Electronics', city: 'Riffa' });
  const tooCheap = await make({ minBudget: 500 });
  const wrongWords = await make({ q: 'xbox' });
  await words.post('/api/push/subscribe').send({ endpoint: 'https://push.example.com/w', keys: { p256dh: 'BKey_2', auth: 'auth_2' } }).expect(201);

  pushed.length = 0;
  await t.listing(buyer, { title: 'Need a PS5 Controller', description: 'White, original, works well', category: 'Electronics', city: 'Manama', budgetMin: 20, budgetMax: 150 });
  for (const s of [words, cat, rich]) assert.deepEqual(await alertsFor(s), ['Need a PS5 Controller']);
  for (const s of [wrongCity, tooCheap, wrongWords]) assert.deepEqual(await alertsFor(s), []);
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(pushed.map((p) => p.body), ['“Need a PS5 Controller” in Manama']);
});

test('one notification per request: no alert for your own request or on top of a favourite heads-up', async () => {
  const buyer = await t.user();
  await buyer.post('/api/alerts').send({ category: 'Electronics' }).expect(201);
  const fan = await t.user();
  await fan.post('/api/alerts').send({ category: 'Electronics' }).expect(201);
  await buyer.put(`/api/members/${fan.id}/favourite`).expect(200);
  await t.listing(buyer, { title: 'Need a phone charger', category: 'Electronics' });
  assert.deepEqual(await alertsFor(buyer), [], 'not my own request');
  const kinds = (await fan.get('/api/notifications')).body.notifications.map((n) => n.kind);
  assert.deepEqual(kinds.filter((k) => k !== 'kyc_approved'), ['favourite-request'], 'only the favourite heads-up');
});
