// Craigslist-style sections (session 82): Housing and Jobs ads next to the
// Wanted requests, with scam checks and a review queue for doubtful ads.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { checkAd } from '../../shared/scam-check.js';

const t = await setup();
const flat = (o = {}) => ({ section: 'housing', title: '2 bedroom flat in Juffair', description: 'Sea view, gym and pool, near the mall.', category: 'Flats & apartments', rent: 350, bedrooms: 2, furnished: true, city: 'Juffair', ...o });
const job = (o = {}) => ({ section: 'jobs', title: 'Barista for a cafe in Seef', description: 'Morning shifts, training given, friendly team.', category: 'Food & hospitality', jobType: 'full-time', budgetMin: 300, budgetMax: 400, city: 'Seef', ...o });
const post = (agent, body) => agent.post('/api/listings').send(body);

test('housing and jobs ads are posted in their own section, with their own fields and categories', async () => {
  const landlord = await t.user();
  const ad = (await post(landlord, flat()).expect(201)).body.listing;
  assert.equal(ad.section, 'housing');
  assert.deepEqual([ad.budgetMin, ad.budgetMax, ad.bedrooms, ad.furnished, ad.held], [350, 350, 2, true, false]);
  const j = (await post(landlord, job()).expect(201)).body.listing;
  assert.deepEqual([j.section, j.jobType, j.budgetMax], ['jobs', 'full-time', 400]);
  // A request category isn't a housing category, and a job needs a type.
  await post(landlord, flat({ category: 'Electronics' })).expect(400);
  await post(landlord, job({ jobType: undefined })).expect(400);
  await post(landlord, flat({ rent: undefined })).expect(400);

  // Each list shows only its own section; the default stays the requests.
  const housing = (await t.request(t.app).get('/api/listings?section=housing').expect(200)).body.listings;
  assert.ok(housing.some((l) => l.id === ad.id));
  assert.ok(housing.every((l) => l.section === 'housing'));
  const requests = (await t.request(t.app).get('/api/listings').expect(200)).body.listings;
  assert.ok(!requests.some((l) => l.id === ad.id || l.id === j.id));
  const furnished = (await t.request(t.app).get('/api/listings?section=housing&furnished=no').expect(200)).body.listings;
  assert.ok(!furnished.some((l) => l.id === ad.id));
  const sections = (await t.request(t.app).get('/api/listings/sections').expect(200)).body;
  assert.ok(sections.sections.housing.categories['Flats & apartments'] >= 1);
  assert.ok(sections.latest.jobs.some((l) => l.id === j.id));
});

test('ads asking for money first, or with phone numbers, are refused', async () => {
  const scammer = await t.user();
  const pay = await post(scammer, flat({ title: 'Cheap flat in Amwaj', description: 'Please send a deposit before the viewing by Western Union.' })).expect(400);
  assert.equal(pay.body.field, 'description');
  await post(scammer, job({ title: 'Hotel staff wanted', description: 'Pay the visa fee and start next week, good salary.' })).expect(400);
  await post(scammer, flat({ title: 'Room in Hoora', description: 'Call me on 3333 4444 for details please.' })).expect(400);
  // Arabic too.
  await post(scammer, job({ title: 'مطلوب موظفين', description: 'ادفع رسوم تسجيل وابدأ العمل غداً' })).expect(400);
  // Requests are not checked this way (they never were).
  await t.listing(scammer, { title: 'Need a gift card', description: 'Looking for an iTunes gift card for my son' });
});

test('the same ad twice, or too many in a day, is refused', async () => {
  const poster = await t.user();
  await post(poster, flat({ title: 'Studio in Adliya' })).expect(201);
  await post(poster, flat({ title: 'studio in adliya' })).expect(409);
  for (let i = 0; i < 4; i += 1) await post(poster, job({ title: `Cashier number ${i + 1}` })).expect(201);
  await post(poster, job({ title: 'One more cashier' })).expect(429);
});

test('too-good ads are held for a check: hidden until an admin approves, removed if not', async () => {
  const poster = await t.user();
  const viewer = await t.user();
  const cheap = (await post(poster, flat({ title: 'Villa for rent in Saar', category: 'Villas & houses', rent: 60 })).expect(201)).body;
  assert.equal(cheap.listing.held, true);
  assert.deepEqual(cheap.held, ['Rent much lower than usual']);
  const id = cheap.listing.id;
  // Hidden from the list, the page and replies; the poster still sees it.
  assert.ok(!(await t.request(t.app).get('/api/listings?section=housing').expect(200)).body.listings.some((l) => l.id === id));
  await viewer.get(`/api/listings/${id}`).expect(404);
  await viewer.post(`/api/listings/${id}/contact`).send({ message: 'Is it available?' }).expect(404);
  await poster.get(`/api/listings/${id}`).expect(200);

  const queue = (await t.admin.get('/api/admin/held-ads').expect(200)).body.ads;
  assert.ok(queue.some((a) => a.id === id && a.reasons[0] === 'Rent much lower than usual'));
  await t.admin.post(`/api/admin/held-ads/${id}/decision`).send({ decision: 'approve' }).expect(200);
  await viewer.get(`/api/listings/${id}`).expect(200);
  // Approved once: editing it doesn't hold it again.
  await poster.patch(`/api/listings/${id}`).send(flat({ title: 'Villa for rent in Saar', category: 'Villas & houses', rent: 65 })).expect(200);
  await viewer.get(`/api/listings/${id}`).expect(200);
  const bell = (await poster.get('/api/notifications').expect(200)).body.notifications;
  assert.ok(bell.some((n) => n.kind === 'ad-approved'));

  const job2 = (await post(poster, job({ title: 'Easy online job', description: 'Work from home, no experience needed, start today.' })).expect(201)).body.listing;
  assert.equal(job2.held, true);
  await t.admin.post(`/api/admin/held-ads/${job2.id}/decision`).send({ decision: 'remove' }).expect(200);
  await viewer.get(`/api/listings/${job2.id}`).expect(404);
});

test('replies to an ad: a private chat, a "reply" notification, and no public list of who replied', async () => {
  const employer = await t.user();
  const applicant = await t.user();
  const ad = (await post(employer, job({ title: 'Delivery driver in Riffa', category: 'Drivers & delivery' })).expect(201)).body.listing;
  await applicant.post(`/api/listings/${ad.id}/contact`).send({ message: 'I have a licence and a car.' }).expect(201);
  const bell = (await employer.get('/api/notifications').expect(200)).body.notifications;
  assert.equal(bell[0].kind, 'ad-reply');
  const page = (await t.request(t.app).get(`/api/listings/${ad.id}`).expect(200)).body.listing;
  assert.deepEqual(page.responders, []);
});

test('the scam check by itself', () => {
  assert.equal(checkAd({ section: 'wanted', description: 'western union' }).block, null);
  assert.ok(checkAd({ section: 'housing', description: 'Pay a deposit before viewing please' }).block);
  assert.ok(checkAd({ section: 'jobs', description: 'Earn BD 500 a week from your phone' }).hold.length);
  assert.deepEqual(checkAd({ section: 'jobs', category: 'IT & tech', price: 900, priceMax: 4000, description: 'Senior developer role' }).hold, ['Pay much higher than usual']);
  assert.deepEqual(checkAd({ section: 'housing', category: 'Rooms & shared', price: 80, description: 'Room near the souq' }), { block: null, hold: [] });
});

// For sale (session 84).
const item = (o = {}) => ({ section: 'forsale', title: 'Used PS5 with two controllers', description: 'Works perfectly, box included.', category: 'Electronics', price: 150, condition: 'used', city: 'Riffa', ...o });

test('for sale ads: an asking price and new/used, listed in their own section', async () => {
  const seller = await t.user();
  const ad = (await post(seller, item()).expect(201)).body.listing;
  assert.deepEqual([ad.section, ad.budgetMin, ad.budgetMax, ad.condition, ad.held], ['forsale', 150, 150, 'used', false]);
  await post(seller, item({ title: 'Another console', price: undefined })).expect(400);
  await post(seller, item({ title: 'A third console', condition: 'any' })).expect(400);
  await post(seller, item({ title: 'Cheap phone', description: 'Pay by gift card and I send it.' })).expect(400);
  const list = (await t.request(t.app).get('/api/listings?section=forsale&condition=new').expect(200)).body.listings;
  assert.ok(!list.some((l) => l.id === ad.id), 'the condition filter works');
  const used = (await t.request(t.app).get('/api/listings?section=forsale&condition=used').expect(200)).body.listings;
  assert.ok(used.some((l) => l.id === ad.id));
  assert.ok((await t.request(t.app).get('/api/meta').expect(200)).body.sections.forsale.includes('Electronics'));
});

test('migration 43 keeps every listing, its section and its chats', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const { MIGRATION_SQL } = await import('../src/db.js');
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (const sql of MIGRATION_SQL.slice(0, 42)) db.exec(sql);
  db.prepare(`INSERT INTO users (email, password_hash, display_name, account_type) VALUES ('a@x', 'h', 'A', 'individual'), ('b@x', 'h', 'B', 'business')`).run();
  db.prepare(`INSERT INTO listings (buyer_id, title, description, category, city, section) VALUES (1, 'Flat', 'A flat to rent', 'Flats & apartments', 'Juffair', 'housing')`).run();
  db.prepare(`INSERT INTO conversations (listing_id, buyer_id, vendor_id) VALUES (1, 1, 2)`).run();
  db.prepare(`INSERT INTO listing_images (listing_id, file) VALUES (1, 'x.jpg')`).run();
  db.exec(MIGRATION_SQL[42]);
  assert.equal(db.prepare('SELECT section FROM listings WHERE id = 1').get().section, 'housing');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM conversations').get().n, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM listing_images').get().n, 1);
  db.prepare(`UPDATE listings SET section = 'forsale' WHERE id = 1`).run();
  assert.throws(() => db.prepare(`UPDATE listings SET section = 'cars' WHERE id = 1`).run());
  assert.ok(db.prepare(`EXPLAIN QUERY PLAN SELECT * FROM listings WHERE section = 'forsale' AND status = 'open' ORDER BY created_at`).all().some((r) => /idx_listings_section/.test(r.detail)));
});
