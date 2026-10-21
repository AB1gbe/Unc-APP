// Profiles (session 13): photo, bio, interests, onboarding flag.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { setup, PNG } from './helpers.js';

const t = await setup();
const { AVATAR_DIR } = await import('../src/lib/uploads.js');
const me = async (a) => (await a.get('/api/auth/me').expect(200)).body.user;

test('edit bio and interests; only the fields sent change', async () => {
  const u = await t.user();
  const before = await me(u);
  const r = await u.patch('/api/auth/me').send({ bio: 'I find rare car parts.', interests: ['Vehicles & Parts', 'Tools & DIY', 'Vehicles & Parts'] }).expect(200);
  assert.equal(r.body.user.bio, 'I find rare car parts.');
  assert.deepEqual(r.body.user.interests, ['Vehicles & Parts', 'Tools & DIY']); // duplicates removed
  assert.equal(r.body.user.displayName, before.displayName); // untouched
  await u.patch('/api/auth/me').send({ interests: ['Not a category'] }).expect(400);
  await u.patch('/api/auth/me').send({ interests: 'Electronics' }).expect(400);
  await u.patch('/api/auth/me').send({ bio: 'x'.repeat(301) }).expect(400);
});

test('profile photo: upload, replace (old file deleted), remove; served publicly', async () => {
  const u = await t.user();
  const first = (await u.post('/api/auth/avatar').attach('avatar', PNG, 'me.png').expect(201)).body.user.avatarUrl;
  assert.match(first, /^\/uploads\/avatars\/[\w-]+\.png$/);
  await t.request(t.app).get(first).expect(200);
  const second = (await u.post('/api/auth/avatar').attach('avatar', PNG, 'me2.png').expect(201)).body.user.avatarUrl;
  assert.notEqual(first, second);
  assert.equal(fs.existsSync(`${AVATAR_DIR()}/${first.split('/').pop()}`), false, 'old photo deleted');
  await u.delete('/api/auth/avatar').expect(200);
  assert.equal((await me(u)).avatarUrl, null);
  assert.equal(fs.existsSync(`${AVATAR_DIR()}/${second.split('/').pop()}`), false);
});

test('profile photo must really be an image, and requires login', async () => {
  const u = await t.user();
  await u.post('/api/auth/avatar').attach('avatar', Buffer.from('<svg onload=alert(1)>'), 'x.png').expect(400);
  await u.post('/api/auth/avatar').expect(400);
  await t.request(t.app).post('/api/auth/avatar').attach('avatar', PNG, 'x.png').expect(401);
});

test('public profile shows photo, bio, city and interests; photos appear next to names', async () => {
  const buyer = await t.user();
  const vendor = await t.user();
  await vendor.post('/api/auth/avatar').attach('avatar', PNG, 'shop.png').expect(201);
  await vendor.patch('/api/auth/me').send({ bio: 'Phone shop in Manama', interests: ['Phones & Tablets'] }).expect(200);
  const p = (await t.request(t.app).get(`/api/members/${vendor.id}`).expect(200)).body.member;
  assert.equal(p.bio, 'Phone shop in Manama');
  assert.deepEqual(p.interests, ['Phones & Tablets']);
  assert.match(p.avatarUrl, /^\/uploads\/avatars\//);
  assert.ok(!JSON.stringify(p).includes('@'), 'no email on the public profile');

  const l = await t.listing(buyer);
  const conv = (await vendor.post(`/api/listings/${l.id}/contact`).send({ message: 'hi' }).expect(201)).body.conversation;
  const seen = (await buyer.get(`/api/conversations/${conv.id}`).expect(200)).body.conversation.other;
  assert.equal(seen.avatarUrl, p.avatarUrl);
});

test('onboarding flag: false for new members, true after finishing or skipping', async () => {
  const u = await t.user('email');
  assert.equal((await me(u)).onboarded, false);
  await u.post('/api/auth/onboarded').expect(200);
  assert.equal((await me(u)).onboarded, true);
});
