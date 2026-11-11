// Verified shops list (session 72): businesses first on Unc.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();

test('lists only verified, non-banned business accounts, and can search them', async () => {
  const shop = await t.user('approved', 'business');
  const person = await t.user('approved', 'individual');
  const pending = await t.user('pending', 'business');
  const banned = await t.user('approved', 'business');
  t.db.prepare(`UPDATE users SET banned_at = datetime('now') WHERE id = ?`).run(banned.id);
  t.db.prepare(`UPDATE users SET display_name = 'Seef Phone House', shop_area = 'Seef' WHERE id = ?`).run(shop.id);

  const all = (await t.request(t.app).get('/api/shops').expect(200)).body.shops;
  const ids = all.map((s) => s.id);
  assert.ok(ids.includes(shop.id), 'the verified shop is listed');
  for (const other of [person, pending, banned]) assert.ok(!ids.includes(other.id), 'no people, unverified or banned accounts');
  const mine = all.find((s) => s.id === shop.id);
  assert.equal(mine.shopArea, 'Seef');
  assert.deepEqual(Object.keys(mine).sort(), ['avatarUrl', 'bio', 'city', 'coverUrl', 'displayName', 'id', 'rating', 'sales', 'shopArea', 'shopHours'].sort(), 'no email or ID data');

  const found = (await t.request(t.app).get('/api/shops?q=phone').expect(200)).body.shops;
  assert.deepEqual(found.map((s) => s.id), [shop.id]);
  assert.equal((await t.request(t.app).get('/api/shops?q=nothing-like-this').expect(200)).body.shops.length, 0);
});
