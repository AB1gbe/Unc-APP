// "Happening near you" (session 26).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const feed = async (a) => (await a.get('/api/feed').expect(200)).body;

test('finds are anonymous; new requests and new shops are listed; own city first', async () => {
  const buyer = await t.user();
  await buyer.patch('/api/auth/me').send({ displayName: 'Secret Buyer', city: 'Riffa' }).expect(200);
  const seller = await t.user('approved', 'business');
  await seller.patch('/api/auth/me').send({ displayName: 'Riffa Gadgets', shopArea: 'Riffa' }).expect(200);
  const found = await t.listing(buyer, { title: 'Private thing I wanted', category: 'Electronics', city: 'Riffa' });
  const conv = (await seller.post(`/api/listings/${found.id}/contact`).send({ message: 'Have it' }).expect(201)).body.conversation;
  await buyer.post(`/api/listings/${found.id}/status`).send({ status: 'fulfilled', conversationId: conv.id }).expect(200);
  const other = await t.user();
  await t.listing(other, { title: 'Need a ladder in Manama', city: 'Manama' });
  await t.listing(other, { title: 'Need a bike in Riffa', city: 'Riffa' });

  const viewer = await t.user();
  await viewer.patch('/api/auth/me').send({ city: 'riffa' }).expect(200);
  const { items } = await feed(viewer);
  const json = JSON.stringify(items);
  assert.ok(!json.includes('Secret Buyer') && !json.includes('Private thing'), 'the buyer and the closed request stay private');
  const find = items.find((i) => i.kind === 'found');
  assert.deepEqual([find.city, find.category, find.near], ['Riffa', 'Electronics', true]);
  assert.ok(items.some((i) => i.kind === 'shop' && i.shop.displayName === 'Riffa Gadgets'));
  const titles = items.filter((i) => i.kind === 'request').map((i) => i.listing.title);
  assert.ok(titles.indexOf('Need a bike in Riffa') < titles.indexOf('Need a ladder in Manama'), 'own city first');
  assert.ok(items.slice(0, items.findIndex((i) => !i.near)).every((i) => i.near));
});

test('busy city: "N offers today"; own requests, closed requests, banned members and individuals-as-shops are left out', async () => {
  const buyer = await t.user();
  await buyer.patch('/api/auth/me').send({ city: 'Hamad Town' }).expect(200);
  const l = await t.listing(buyer, { title: 'Need a fridge in Hamad Town', city: 'Hamad Town' });
  for (let i = 0; i < 2; i++) await (await t.user()).post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201);
  let items = (await feed(buyer)).items;
  assert.deepEqual(items.find((i) => i.kind === 'offers-today'), { kind: 'offers-today', at: items.find((i) => i.kind === 'offers-today').at, city: 'Hamad Town', near: true, count: 2 });
  assert.ok(!items.some((i) => i.listing?.id === l.id), 'not my own request');

  const someone = await t.user();
  assert.ok((await feed(someone)).items.some((i) => i.listing?.id === l.id));
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'closed' }).expect(200);
  assert.ok(!(await feed(someone)).items.some((i) => i.listing?.id === l.id), 'closed requests drop off');

  const banned = await t.user();
  const b = await t.listing(banned, { title: 'Banned member request' });
  await t.admin.post(`/api/admin/users/${banned.id}/ban`).send({ banned: true }).expect(200);
  items = (await feed(someone)).items;
  assert.ok(!items.some((i) => i.listing?.id === b.id));
  assert.ok(!items.some((i) => i.kind === 'shop' && i.shop.id === someone.id), 'individuals are not shops');

  // Visitors (logged out) get the feed too, with no "near" ordering.
  const visitor = await feed(t.request(t.app));
  assert.equal(visitor.city, null);
  assert.ok(visitor.items.every((i) => i.near === false));
});
