// Businesses (session 88): pay for ads like on Craigslist, a business
// panel, and team members.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const item = (o = {}) => ({ section: 'forsale', title: `Phone case ${Math.random().toString(36).slice(2, 7)}`, description: 'New, in the box.', category: 'Phones & Tablets', price: 5, condition: 'new', city: 'Seef', ...o });
const job = (o = {}) => ({ section: 'jobs', title: `Cashier ${Math.random().toString(36).slice(2, 7)}`, description: 'Evening shifts, training given.', category: 'Sales & retail', jobType: 'part-time', city: 'Seef', ...o });

test('people post for free; a business pays per ad from its card, with a receipt', async () => {
  const person = await t.user();
  const free = await person.post('/api/listings').send(item()).expect(201);
  assert.deepEqual(free.body.paid, { amount: 0, from: 'free' });

  const shop = await t.user('approved', 'business');
  const paid = (await shop.post('/api/listings').send(job()).expect(201)).body;
  assert.deepEqual(paid.paid, { amount: 5000, from: 'card' });
  const billing = (await shop.get('/api/business/billing').expect(200)).body;
  assert.equal(billing.prices.jobs, 5000);
  assert.equal(billing.payments.length, 1);
  assert.match(billing.payments[0].receiptNo, /^UNC-\d{4}-\d{6}$/);
  assert.equal(billing.payments[0].listingTitle, paid.listing.title);
  const receipt = (await shop.get(`/api/business/billing/receipts/${billing.payments[0].id}`).expect(200)).body.receipt;
  assert.equal(receipt.amount, 5000);
  assert.match(receipt.business.cr, /^\d+-1$/);
  // Requests and offers stay free for businesses too.
  assert.deepEqual((await shop.post('/api/listings').send({ title: 'Looking for shelving', description: 'Metal shelves for the stock room', category: 'Tools & DIY', city: 'Seef' }).expect(201)).body.paid, { amount: 0, from: 'free' });
  // Someone else can't see the receipt.
  await person.get(`/api/business/billing/receipts/${billing.payments[0].id}`).expect(403);
});

test('a pack adds credit with a bonus, and ads are paid from it first', async () => {
  const shop = await t.user('approved', 'business');
  const bought = (await shop.post('/api/business/billing/packs').send({ pack: 'pack10' }).expect(201)).body;
  assert.equal(bought.credit, 11000);
  for (let i = 0; i < 2; i += 1) assert.equal((await shop.post('/api/listings').send(job()).expect(201)).body.paid.from, 'credit');
  assert.equal((await shop.get('/api/business/billing').expect(200)).body.credit, 1000);
  // BD 1 left: a BD 1 For sale ad uses it; the next job goes to the card.
  assert.equal((await shop.post('/api/listings').send(item()).expect(201)).body.paid.from, 'credit');
  assert.equal((await shop.post('/api/listings').send(job()).expect(201)).body.paid.from, 'card');
  const billing = (await shop.get('/api/business/billing').expect(200)).body;
  assert.equal(billing.credit, 0);
  assert.deepEqual(billing.payments.map((p) => p.kind), ['ad', 'pack']);
  await shop.post('/api/business/billing/packs').send({ pack: 'free-money' }).expect(400);
});

test('a declined card means no ad is created', async () => {
  const shop = await t.user('approved', 'business');
  await shop.post('/api/payments/card').send({ token: 'tok_test_visa_0341_12_39' }).expect(201);
  const before = t.db.prepare('SELECT COUNT(*) AS n FROM listings').get().n;
  await shop.post('/api/listings').send(job({ title: 'Declined card job' })).expect(402);
  assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM listings').get().n, before);
});

test('the business panel shows the numbers for its own ads only', async () => {
  const shop = await t.user('approved', 'business');
  const person = await t.user();
  await person.get('/api/business/dashboard').expect(403);
  const ad = (await shop.post('/api/listings').send(item({ title: 'Screen protector pack' })).expect(201)).body.listing;
  await person.get(`/api/listings/${ad.id}`).expect(200);
  await person.post(`/api/listings/${ad.id}/contact`).send({ message: 'Still available?' }).expect(201);
  const dash = (await shop.get('/api/business/dashboard').expect(200)).body;
  assert.deepEqual([dash.thisWeek.views, dash.thisWeek.replies, dash.thisWeek.adsPosted, dash.openAds], [1, 1, 1, 1]);
  const ads = (await shop.get('/api/business/ads').expect(200)).body.ads;
  assert.deepEqual(ads.map((a) => [a.title, a.views, a.replies, a.paid]), [['Screen protector pack', 1, 1, 1000]]);
});

test('team: invite by email, accept, switch to the business, post for it, switch back', async () => {
  const shop = await t.user('approved', 'business');
  const staff = await t.user('email');
  const staffEmail = (await staff.get('/api/auth/me').expect(200)).body.user.email;
  const shopName = (await shop.get('/api/auth/me').expect(200)).body.user.displayName;
  await shop.post('/api/business/team/invites').send({ email: staffEmail }).expect(201);
  const mine = (await staff.get('/api/team').expect(200)).body;
  assert.equal(mine.invites[0].business.displayName, shopName);
  assert.ok((await staff.get('/api/notifications').expect(200)).body.notifications.some((n) => n.kind === 'team-invite'));
  await staff.post(`/api/team/invites/${mine.invites[0].id}/accept`).expect(200);
  assert.equal((await shop.get('/api/business/team').expect(200)).body.members[0].email, staffEmail);

  // Switch: now "me" is the business, with the staff member as actor.
  await staff.post(`/api/team/switch/${shop.id}`).expect(200);
  const me = (await staff.get('/api/auth/me').expect(200)).body.user;
  assert.equal(me.id, shop.id);
  assert.equal(me.actor.id, staff.id);
  const ad = (await staff.post('/api/listings').send(job({ title: 'Posted by the team' })).expect(201)).body;
  assert.equal(ad.listing.buyer.id, shop.id, 'the ad belongs to the business');
  assert.equal(ad.paid.from, 'card', 'and the business pays for it');
  const ads = (await shop.get('/api/business/ads').expect(200)).body.ads;
  assert.equal(ads.find((a) => a.title === 'Posted by the team').postedBy, (await t.db.prepare('SELECT display_name AS n FROM users WHERE id = ?').get(staff.id)).n);
  // But not the owner's private things.
  await staff.post('/api/business/billing/packs').send({ pack: 'pack10' }).expect(403);
  await staff.get('/api/business/team').expect(403);
  await staff.post('/api/payments/card').send({ token: 'tok_test_visa_4242_12_39' }).expect(403);
  await staff.post('/api/auth/change-password').send({ currentPassword: 'Password123', newPassword: 'Password456' }).expect(403);
  await staff.patch('/api/auth/me').send({ displayName: 'Hacked' }).expect(403);
  await staff.get('/api/auth/me/export').expect(403);
  // Back to the staff member's own account.
  await staff.post('/api/team/switch-back').expect(200);
  assert.equal((await staff.get('/api/auth/me').expect(200)).body.user.id, staff.id);
});

test('team: only members can switch, and removing someone logs them out of the business', async () => {
  const shop = await t.user('approved', 'business');
  const staff = await t.user('email');
  const stranger = await t.user('email');
  const email = (await staff.get('/api/auth/me').expect(200)).body.user.email;
  await stranger.post(`/api/team/switch/${shop.id}`).expect(403);
  await shop.post('/api/business/team/invites').send({ email }).expect(201);
  const invite = (await staff.get('/api/team').expect(200)).body.invites[0];
  // Another member can't accept an invitation that isn't for their email.
  await stranger.post(`/api/team/invites/${invite.id}/accept`).expect(404);
  await staff.post(`/api/team/invites/${invite.id}/accept`).expect(200);
  await staff.post(`/api/team/switch/${shop.id}`).expect(200);
  await shop.delete(`/api/business/team/members/${staff.id}`).expect(200);
  await staff.get('/api/auth/me').expect(200).then((r) => assert.equal(r.body.user, null, 'the business session is gone'));
  // People (not businesses) have no panel.
  const person = await t.user();
  await person.post('/api/business/team/invites').send({ email: 'x@y.z' }).expect(403);
});
