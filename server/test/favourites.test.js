// Favourite sellers (session 28).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { setPushSender } = await import('../src/lib/push.js');
const pushed = [];
setPushSender(async (sub, payload) => { pushed.push({ endpoint: sub.endpoint, ...JSON.parse(payload) }); });
const kinds = async (a) => (await a.get('/api/notifications').expect(200)).body.notifications.map((n) => n.kind);

test('favourite a seller: once, shown on the profile with a count, listed on my favourites, removable', async () => {
  const buyer = await t.user();
  const seller = await t.user('approved', 'business');
  await buyer.put(`/api/members/${seller.id}/favourite`).expect(200);
  await buyer.put(`/api/members/${seller.id}/favourite`).expect(200); // twice is fine
  let m = (await buyer.get(`/api/members/${seller.id}`).expect(200)).body.member;
  assert.equal(m.favourite, true);
  assert.equal(m.favouriteCount, 1);
  assert.equal((await t.request(t.app).get(`/api/members/${seller.id}`)).body.member.favourite, undefined, 'visitors');
  assert.deepEqual((await buyer.get('/api/favourites').expect(200)).body.sellers.map((s) => s.id), [seller.id]);

  await buyer.delete(`/api/members/${seller.id}/favourite`).expect(200);
  m = (await buyer.get(`/api/members/${seller.id}`).expect(200)).body.member;
  assert.equal(m.favourite, false);
  assert.equal(m.favouriteCount, 0);
});

test('not yourself, not unverified or unknown members, not logged out', async () => {
  const me = await t.user();
  await me.put(`/api/members/${me.id}/favourite`).expect(400);
  const unverified = await t.user('email');
  await me.put(`/api/members/${unverified.id}/favourite`).expect(404);
  await me.put('/api/members/999999/favourite').expect(404);
  await t.request(t.app).put(`/api/members/${me.id}/favourite`).expect(401);
});

test('a new request tells favourite sellers in that category first (🔔 + push), others not', async () => {
  const buyer = await t.user();
  await buyer.patch('/api/auth/me').send({ displayName: 'Mona' }).expect(200);
  const phones = await t.user('approved', 'business');
  await phones.patch('/api/auth/me').send({ interests: ['Phones & Tablets'] }).expect(200);
  await phones.post('/api/push/subscribe').send({ endpoint: 'https://push.example.com/phones', keys: { p256dh: 'BKey_1', auth: 'auth_1' } }).expect(201);
  const furniture = await t.user();
  await furniture.patch('/api/auth/me').send({ interests: ['Home & Furniture'] }).expect(200);
  const anything = await t.user(); // no interests: hears about everything
  const notFavourite = await t.user();
  for (const s of [phones, furniture, anything]) await buyer.put(`/api/members/${s.id}/favourite`).expect(200);

  pushed.length = 0;
  const l = await t.listing(buyer, { title: 'Need an iPhone 15 case', category: 'Phones & Tablets' });
  assert.ok((await kinds(phones)).includes('favourite-request'));
  assert.ok((await kinds(anything)).includes('favourite-request'));
  assert.ok(!(await kinds(furniture)).includes('favourite-request'), 'not their category');
  assert.ok(!(await kinds(notFavourite)).includes('favourite-request'));
  const n = (await phones.get('/api/notifications')).body.notifications.find((x) => x.kind === 'favourite-request');
  assert.equal(n.actor.displayName, 'Mona');
  assert.equal(n.listing.id, l.id);
  await new Promise((r) => setImmediate(r));
  assert.equal(pushed.length, 1);
  assert.equal(pushed[0].url, `/requests/${l.id}`);
  assert.match(pushed[0].body, /Mona, who favourited you, is looking for “Need an iPhone 15 case”/);
});
