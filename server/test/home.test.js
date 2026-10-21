// Member home page data (session 13).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const titles = async (a) => (await a.get('/api/listings/for-you').expect(200)).body.listings.map((l) => l.title);

test('"for you" follows interests, skips own and already-answered requests, same city first', async () => {
  const buyer = await t.user();
  const other = await t.user();
  const vendor = await t.user();
  await vendor.patch('/api/auth/me').send({ interests: ['Electronics'], city: 'Riffa' }).expect(200);

  await t.listing(buyer, { title: 'Need a phone charger', category: 'Electronics', city: 'Manama' });
  const answered = await t.listing(buyer, { title: 'Need a game console', category: 'Electronics', city: 'Manama' });
  await t.listing(other, { title: 'Want a laptop in Riffa', category: 'Electronics', city: 'Riffa' });
  await t.listing(buyer, { title: 'Need a dining table', category: 'Home & Furniture', city: 'Riffa' });
  await t.listing(vendor, { title: 'My own electronics request', category: 'Electronics', city: 'Riffa' });
  await vendor.post(`/api/listings/${answered.id}/contact`).send({ message: 'I have one' }).expect(201);

  const list = await titles(vendor);
  assert.equal(list[0], 'Want a laptop in Riffa', 'same city first');
  assert.ok(list.includes('Need a phone charger'));
  assert.ok(!list.includes('Need a game console'), 'already answered');
  assert.ok(!list.includes('Need a dining table'), 'not in interests');
  assert.ok(!list.includes('My own electronics request'), 'own request');
});

test('with no interests chosen, "for you" shows the newest open requests', async () => {
  const u = await t.user();
  const r = (await u.get('/api/listings/for-you').expect(200)).body;
  assert.equal(r.basedOnInterests, false);
  assert.ok(r.listings.length > 0);
  await t.request(t.app).get('/api/listings/for-you').expect(401);
});
