// "What people are asking for" (session 34).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { topWords } from '../src/routes/demand.js';

const t = await setup();

test('topWords: words used in 2+ requests, without filler words', () => {
  assert.deepEqual(topWords(['Looking for a PS5 controller', 'Need PS5 disc', 'PS5 controller wanted', 'Old radio']), ['ps5', 'controller']);
  assert.deepEqual(topWords(['أبحث عن بلايستيشن 5', 'مطلوب بلايستيشن مستعمل']), ['بلايستيشن']);
  assert.deepEqual(topWords(['One lonely request']), [], "one request's words are never shown");
});

test('sellers see counts per category, waiting requests first, and can narrow it to a governorate', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const make = (title, category, city) => t.listing(buyer, { title, category, city });
  const p1 = await make('Looking for a PS5 controller', 'Electronics', 'Manama');
  await make('Need a PS5 controller, white', 'Electronics', 'Riffa');
  await make('PS5 disc edition wanted', 'Electronics', 'Seef');
  await make('Oak dining table', 'Home & Furniture', 'Manama');
  await make('Glass dining table', 'Home & Furniture', 'Manama');
  await make('A single bike', 'Sports & Outdoors', 'Manama'); // only 1: hidden
  await seller.post(`/api/listings/${p1.id}/contact`).send({ message: 'I have one' }).expect(201);

  await (await t.user('email')).get('/api/demand').expect(403); // verified members only
  const all = (await seller.get('/api/demand').expect(200)).body;
  assert.equal(all.days, 30);
  assert.deepEqual(all.categories.map((c) => [c.category, c.requests, c.waiting]), [['Electronics', 3, 2], ['Home & Furniture', 2, 2]]);
  assert.deepEqual(all.categories[0].words, ['ps5'], 'words come only from requests still waiting');
  assert.deepEqual(all.categories[1].words, ['dining', 'table']);
  assert.ok(!JSON.stringify(all).includes('User '), 'no names');

  const capital = (await seller.get('/api/demand?area=Capital').expect(200)).body;
  assert.equal(capital.area, 'Capital');
  assert.deepEqual(capital.categories.map((c) => [c.category, c.requests]), [['Home & Furniture', 2], ['Electronics', 2]]);
});
