// Shop pages for business accounts (session 24): cover, area, opening
// hours, and no way to put contact details on a public page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, PNG } from './helpers.js';
import { openState } from '../../client/src/hours.js';

const t = await setup();
const week = (h) => Array.from({ length: 7 }, (_, d) => (d === 5 ? null : h)); // closed on Fridays

test('a business sets up its shop page; everyone sees it on the profile', async () => {
  const shop = await t.user('approved', 'business');
  const me = (await shop.patch('/api/auth/me').send({ shopArea: 'Seef, Manama', shopHours: week({ open: '09:00', close: '21:00' }) }).expect(200)).body.user;
  assert.equal(me.shopArea, 'Seef, Manama');
  assert.equal(me.shopHours[5], null);
  const cover = (await shop.post('/api/auth/cover').attach('cover', PNG, 'c.png').expect(201)).body.user.coverUrl;
  await t.request(t.app).get(cover).expect(200);

  const m = (await t.request(t.app).get(`/api/members/${shop.id}`).expect(200)).body.member;
  assert.equal(m.coverUrl, cover);
  assert.equal(m.shopArea, 'Seef, Manama');
  assert.deepEqual(m.shopHours[0], { open: '09:00', close: '21:00' });

  await shop.delete('/api/auth/cover').expect(200);
  await t.request(t.app).get(cover).expect(404);
});

test('individuals have no shop page; hours must be real times', async () => {
  const person = await t.user();
  await person.patch('/api/auth/me').send({ shopArea: 'Riffa' }).expect(400);
  await person.post('/api/auth/cover').attach('cover', PNG, 'c.png').expect(400);
  assert.equal((await t.request(t.app).get(`/api/members/${person.id}`)).body.member.shopArea, undefined);

  const shop = await t.user('approved', 'business');
  for (const bad of [[], week({ open: '9am', close: '21:00' }), week({ open: '25:00', close: '21:00' }), week({ open: '10:00', close: '10:00' }), 'always']) {
    await shop.patch('/api/auth/me').send({ shopHours: bad }).expect(400);
  }
  await shop.patch('/api/auth/me').send({ shopHours: week({ open: '18:00', close: '02:00' }) }).expect(200); // past midnight is fine
  await shop.patch('/api/auth/me').send({ shopHours: null }).expect(200); // and can be removed
});

test('no phone numbers, links, emails or @handles in public text', async () => {
  const shop = await t.user('approved', 'business');
  for (const text of ['Call 3912 3456 anytime', 'WhatsApp +973 3912-3456', 'Order at www.myshop.com', 'myshop.bh', 'shop@mail.com', 'DM @myshop_bh', 'اتصل ٣٩١٢٣٤٥٦']) {
    await shop.patch('/api/auth/me').send({ bio: text }).expect(400);
    await shop.patch('/api/auth/me').send({ shopArea: text }).expect(400);
  }
  await shop.patch('/api/auth/me').send({ bio: 'Family shop since 2010, open 7 days.', shopArea: 'Block 428, Seef' }).expect(200);
});

test('"open now" follows the hours, including late shifts past midnight', () => {
  const at = (iso) => new Date(`${iso}:00`); // local time
  const hours = week({ open: '09:00', close: '21:00' });
  assert.deepEqual(openState(hours, at('2026-10-18T10:30')), { open: true, until: '21:00' }); // Sunday
  assert.deepEqual(openState(hours, at('2026-10-18T08:00')), { open: false, next: { day: 0, time: '09:00' } });
  assert.deepEqual(openState(hours, at('2026-10-22T22:00')), { open: false, next: { day: 6, time: '09:00' } }); // Thu night -> Sat (Fri closed)
  const late = week({ open: '18:00', close: '02:00' });
  assert.deepEqual(openState(late, at('2026-10-19T01:00')), { open: true, until: '02:00' }); // Monday 1am, from Sunday's shift
  assert.deepEqual(openState(late, at('2026-10-19T23:00')), { open: true, until: '02:00' });
  assert.equal(openState(null), null);
  assert.deepEqual(openState(Array(7).fill(null)), { open: false, next: null });
});
