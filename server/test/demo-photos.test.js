// The example photos in the demo data (session 54).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { seedDemo } = await import('../src/seed.js');

test('npm run seed gives the demo requests, offers, profiles and story real photos, once', async () => {
  await seedDemo(t.db);
  await seedDemo(t.db); // seeding again adds nothing
  // 4 original demo requests + one photo for each example request in server/src/demo-requests.js (session 72).
  const { DEMO_REQUESTS } = await import('../src/demo-requests.js');
  const { DEMO_ADS } = await import('../src/demo-ads.js');
  // + one photo per For sale demo ad (session 84).
  assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM listing_images').get().n, 4 + DEMO_REQUESTS.length + DEMO_ADS.filter((a) => a[13]).length);
  // Every category has at least one open example request.
  const { CATEGORIES } = await import('../src/lib/categories.js');
  for (const c of CATEGORIES) assert.ok(t.db.prepare("SELECT 1 FROM listings WHERE category = ? AND status = 'open'").get(c), `no open demo request in ${c}`);
  assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM messages WHERE image IS NOT NULL').get().n, 2);
  // 3 members + 3 more demo shops (session 72), each with a profile photo; all 4 shops have a cover.
  assert.equal(t.db.prepare("SELECT COUNT(*) AS n FROM users WHERE email LIKE '%@demo.local' AND avatar IS NOT NULL").get().n, 6);
  assert.equal(t.db.prepare("SELECT COUNT(*) AS n FROM users WHERE account_type = 'business' AND cover IS NOT NULL").get().n, 4);

  // They are served like any upload: request photos publicly...
  const browse = (await t.request(t.app).get('/api/listings').expect(200)).body.listings;
  const ps5 = browse.find((l) => l.title.startsWith('Looking for a used PS5'));
  assert.equal(ps5.images.length, 1);
  const img = await t.request(t.app).get(ps5.images[0]).expect(200);
  assert.match(img.headers['content-type'], /image\/jpeg/);
  // ...and offer photos only inside the buyer's chat.
  const buyer = t.request.agent(t.app);
  await buyer.post('/api/auth/login').send({ email: 'buyer@demo.local', password: 'Password123' }).expect(200);
  const convs = (await buyer.get(`/api/listings/${ps5.id}/conversations`).expect(200)).body.conversations;
  assert.ok(convs.every((c) => c.compare.photoUrl), 'both offers show their photo in Compare offers');
  await buyer.get(convs[0].compare.photoUrl).expect(200);
  await t.request(t.app).get(convs[0].compare.photoUrl).expect(401);
});
