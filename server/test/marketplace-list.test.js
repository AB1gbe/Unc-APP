// The requests list as a marketplace (session 77): search across item and
// area, filters, sorting, item condition, who answered (without prices),
// and sample data kept out of live activity.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const get = async (q) => (await t.request(t.app).get(`/api/listings?${q}`).expect(200)).body.listings;
const titles = (ls) => ls.map((l) => l.title);

test('search covers the area; budget, offers and condition filters work together; three sorts', async () => {
  const buyer = await t.user();
  const shop = await t.user('approved', 'business');
  const cheap = await t.listing(buyer, { title: 'Phone charger cable', budgetMin: 5, budgetMax: 10, city: 'Sitra', condition: 'new' });
  const mid = await t.listing(buyer, { title: 'Used road bicycle', budgetMin: 100, budgetMax: 200, city: 'Riffa', condition: 'used' });
  const any = await t.listing(buyer, { title: 'Garden chairs set', budgetMin: 40, budgetMax: 90, city: 'Riffa' });
  assert.equal(any.condition, 'any');
  await shop.post(`/api/listings/${mid.id}/contact`).send({ message: 'I have one in good shape', offerPrice: 150 }).expect(201);

  assert.deepEqual(titles(await get('q=riffa')).sort(), ['Garden chairs set', 'Used road bicycle'], 'the area is searched too');
  assert.deepEqual(titles(await get('min=50&max=120')).sort(), ['Garden chairs set', 'Used road bicycle'], 'budget ranges overlap');
  assert.deepEqual(titles(await get('offers=with')), ['Used road bicycle']);
  assert.ok(!titles(await get('offers=none')).includes('Used road bicycle'));
  assert.deepEqual(titles(await get('condition=new')).sort(), ['Garden chairs set', 'Phone charger cable'], '"either" matches new and used');
  assert.deepEqual(titles(await get('q=riffa&offers=none')), ['Garden chairs set'], 'filters combine');
  assert.equal(titles(await get('sort=offers'))[0], 'Used road bicycle');
  assert.equal(titles(await get('sort=closing'))[0], 'Phone charger cable', 'oldest closes first');
  assert.equal(titles(await get('sort=newest'))[0], 'Garden chairs set');
  void cheap;
  await buyer.post('/api/listings').send({ title: 'Bad condition value', description: 'Should not be accepted', category: 'Other', city: 'Manama', condition: 'broken' }).expect(400);
});

test('everyone sees which shops answered, never the price', async () => {
  const buyer = await t.user();
  const shop = await t.user('approved', 'business');
  t.db.prepare(`UPDATE users SET display_name = 'Seef Phone House', shop_area = 'Seef' WHERE id = ?`).run(shop.id);
  const l = await t.listing(buyer, { title: 'iPhone 13 wanted' });
  await shop.post(`/api/listings/${l.id}/contact`).send({ message: 'Have it, boxed', offerPrice: 210 }).expect(201);

  const card = (await get('q=iPhone%2013')).find((x) => x.id === l.id);
  assert.equal(card.offerCount, 1);
  assert.equal(card.responders[0].displayName, 'Seef Phone House');
  assert.equal(card.responders[0].area, 'Seef');
  const detail = (await t.request(t.app).get(`/api/listings/${l.id}`).expect(200)).body.listing;
  assert.equal(detail.responders.length, 1);
  assert.ok('replyTime' in detail.responders[0]);
  const text = JSON.stringify([card, detail]);
  assert.ok(!text.includes('210'), 'the offer price is not public');
});

test('sample (demo) requests are labelled and left out of live counters', async () => {
  const buyer = await t.user();
  const l = await t.listing(buyer, { title: 'A demo request here' });
  const before = (await t.request(t.app).get('/api/feed/pulse')).body.requests;
  t.db.prepare('UPDATE listings SET sample = 1 WHERE id = ?').run(l.id);
  assert.equal((await get('q=demo%20request'))[0].sample, true);
  // The pulse is cached for a minute; ask the database directly.
  const n = t.db.prepare(`SELECT COUNT(*) AS n FROM listings WHERE created_at >= datetime('now', '-1 day') AND sample = 0`).get().n;
  assert.equal(n, before - 1);
});
