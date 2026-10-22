// Bahrain governorates and areas (session 31): tidy spellings, governorate
// search, alerts and "near you".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { normalizeCity, governorateOf, placeName } from '../../shared/areas.js';

const t = await setup();

test('spellings become one name; Arabic shown in Arabic; unknown towns stay as typed', () => {
  for (const s of ['manama', 'المنامة', 'Manama City', 'MANAMA', ' Manama ']) assert.equal(normalizeCity(s), 'Manama');
  assert.equal(normalizeCity('al-seef'), 'Seef');
  assert.equal(normalizeCity('madinat hamad'), 'Hamad Town');
  assert.equal(normalizeCity('Austin'), 'Austin');
  assert.equal(governorateOf('Juffair'), 'Capital');
  assert.equal(governorateOf('الرفاع'), 'Southern');
  assert.equal(placeName('Seef', 'ar'), 'السيف');
  assert.equal(placeName('Seef', 'en'), 'Seef');
});

test('requests and profiles store the tidy name; Browse can search a whole governorate', async () => {
  const buyer = await t.user();
  const me = (await buyer.patch('/api/auth/me').send({ city: 'juffair' }).expect(200)).body.user;
  assert.equal(me.city, 'Juffair');
  const a = await t.listing(buyer, { title: 'Need a sofa in Seef', city: 'السيف' });
  const b = await t.listing(buyer, { title: 'Need a desk in Riffa', city: 'riffa' });
  assert.equal(a.city, 'Seef');
  const titles = async (q) => (await t.request(t.app).get(`/api/listings?city=${encodeURIComponent(q)}`).expect(200)).body.listings.map((l) => l.id);
  assert.ok((await titles('Capital Governorate')).includes(a.id));
  assert.ok(!(await titles('Capital Governorate')).includes(b.id));
  assert.ok((await titles('محافظة العاصمة')).includes(a.id));
  assert.ok((await titles('seef')).includes(a.id));
});

test('an alert for a governorate matches its areas; "near you" counts the same governorate', async () => {
  const seller = await t.user();
  await seller.post('/api/alerts').send({ city: 'Muharraq Governorate' }).expect(201);
  const buyer = await t.user();
  await t.listing(buyer, { title: 'Need a bike in Arad', city: 'Arad' });
  await t.listing(buyer, { title: 'Need a bike in Saar', city: 'Saar' });
  const got = (await seller.get('/api/notifications')).body.notifications.filter((n) => n.kind === 'alert-match').map((n) => n.listing.title);
  assert.deepEqual(got, ['Need a bike in Arad']);

  const viewer = await t.user();
  await viewer.patch('/api/auth/me').send({ city: 'Hidd' }).expect(200);
  const items = (await viewer.get('/api/feed').expect(200)).body.items;
  assert.equal(items.find((i) => i.listing?.title === 'Need a bike in Arad').near, true, 'Arad and Hidd are both in Muharraq');
  assert.equal(items.find((i) => i.listing?.title === 'Need a bike in Saar').near, false);
});
