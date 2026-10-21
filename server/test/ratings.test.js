import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { db } = t;

// buyer posts, vendor (and optionally a second vendor) make offers
async function scenario({ vendors = 1 } = {}) {
  const buyer = await t.user();
  const vs = [];
  for (let i = 0; i < vendors; i++) vs.push(await t.user());
  const listing = await t.listing(buyer);
  const convs = [];
  for (const v of vs) convs.push((await v.post(`/api/listings/${listing.id}/contact`).send({ message: 'I have it' }).expect(201)).body.conversation);
  return { buyer, vendors: vs, vendor: vs[0], listing, convs, conv: convs[0] };
}
const fulfil = (s, conversationId) => s.buyer.post(`/api/listings/${s.listing.id}/status`).send({ status: 'fulfilled', conversationId });
const dealOf = async (agent, convId) => (await agent.get(`/api/conversations/${convId}`).expect(200)).body.conversation.deal;
const profile = async (id) => (await t.request(t.app).get(`/api/members/${id}`).expect(200)).body;

test('marking fulfilled with a conversation creates a deal both sides can see', async () => {
  const s = await scenario();
  const res = await fulfil(s, s.conv.id).expect(200);
  assert.equal(res.body.listing.dealConversationId, s.conv.id);
  const forVendor = await dealOf(s.vendor, s.conv.id);
  const forBuyer = await dealOf(s.buyer, s.conv.id);
  assert.equal(forVendor.id, forBuyer.id);
  assert.equal(forBuyer.canRate, true);
  const inbox = (await s.vendor.get('/api/conversations')).body.conversations;
  assert.equal(inbox[0].needsRating, true);
});

test('fulfilled without a conversation (bought elsewhere) creates no deal', async () => {
  const s = await scenario();
  await fulfil(s).expect(200);
  assert.equal(await dealOf(s.buyer, s.conv.id), null);
});

test('a conversation from another request cannot become the deal', async () => {
  const a = await scenario();
  const b = await scenario();
  const res = await fulfil(a, b.conv.id);
  assert.equal(res.status, 400);
  assert.equal(res.body.field, 'conversationId');
});

test('blind ratings: hidden until both sides rate', async () => {
  const s = await scenario();
  await fulfil(s, s.conv.id).expect(200);
  const deal = await dealOf(s.buyer, s.conv.id);

  await s.buyer.post(`/api/deals/${deal.id}/rating`).send({ stars: 5, comment: 'Great seller' }).expect(201);
  assert.equal((await profile(s.vendor.id)).member.rating.count, 0, 'not visible yet');
  const vendorView = await dealOf(s.vendor, s.conv.id);
  assert.equal(vendorView.otherHasRated, true);
  assert.equal(vendorView.theirRating, null, 'vendor cannot peek before rating');

  await s.vendor.post(`/api/deals/${deal.id}/rating`).send({ stars: 4 }).expect(201);
  const vp = await profile(s.vendor.id);
  assert.deepEqual(vp.member.rating, { average: 5, count: 1 });
  assert.equal(vp.reviews[0].comment, 'Great seller');
  assert.equal(vp.reviews[0].role, 'vendor');
  assert.equal(vp.reviews[0].listingTitle, s.listing.title);
  assert.deepEqual((await profile(s.buyer.id)).member.rating, { average: 4, count: 1 });
  assert.equal((await dealOf(s.vendor, s.conv.id)).theirRating.stars, 5);
});

test('a single rating becomes visible after 14 days', async () => {
  const s = await scenario();
  await fulfil(s, s.conv.id).expect(200);
  const deal = await dealOf(s.buyer, s.conv.id);
  await s.buyer.post(`/api/deals/${deal.id}/rating`).send({ stars: 2 }).expect(201);
  db.prepare(`UPDATE deals SET created_at = datetime('now', '-15 days') WHERE id = ?`).run(deal.id);
  assert.equal((await profile(s.vendor.id)).member.rating.count, 1);
});

test('ratings close 30 days after the deal', async () => {
  const s = await scenario();
  await fulfil(s, s.conv.id).expect(200);
  const deal = await dealOf(s.buyer, s.conv.id);
  db.prepare(`UPDATE deals SET created_at = datetime('now', '-31 days') WHERE id = ?`).run(deal.id);
  await s.buyer.post(`/api/deals/${deal.id}/rating`).send({ stars: 5 }).expect(409);
  assert.equal((await dealOf(s.buyer, s.conv.id)).canRate, false);
});

test('one rating per side; stars must be a whole number 1-5', async () => {
  const s = await scenario();
  await fulfil(s, s.conv.id).expect(200);
  const deal = await dealOf(s.buyer, s.conv.id);
  for (const stars of [0, 6, 3.5, 'five', undefined]) {
    await s.buyer.post(`/api/deals/${deal.id}/rating`).send({ stars }).expect(400);
  }
  await s.buyer.post(`/api/deals/${deal.id}/rating`).send({ stars: 3 }).expect(201);
  await s.buyer.post(`/api/deals/${deal.id}/rating`).send({ stars: 5 }).expect(409);
});

test('only the two people in the deal can rate it', async () => {
  const s = await scenario({ vendors: 2 });
  await fulfil(s, s.conv.id).expect(200);
  const deal = await dealOf(s.buyer, s.conv.id);
  await s.vendors[1].post(`/api/deals/${deal.id}/rating`).send({ stars: 1 }).expect(404); // the vendor who lost the deal
  const outsider = await t.user();
  await outsider.post(`/api/deals/${deal.id}/rating`).send({ stars: 1 }).expect(404);
  await t.request(t.app).post(`/api/deals/${deal.id}/rating`).send({ stars: 1 }).expect(401);
  // and a conversation that is not the deal has no deal at all
  assert.equal(await dealOf(s.vendors[1], s.convs[1].id), null);
});

test('the buyer can switch or undo the deal until someone rates it', async () => {
  const s = await scenario({ vendors: 2 });
  await fulfil(s, s.convs[0].id).expect(200);
  await fulfil(s, s.convs[1].id).expect(200); // picked the wrong vendor first
  assert.equal(await dealOf(s.buyer, s.convs[0].id), null);
  const deal = await dealOf(s.buyer, s.convs[1].id);
  assert.ok(deal);

  await s.vendors[1].post(`/api/deals/${deal.id}/rating`).send({ stars: 5 }).expect(201);
  await fulfil(s, s.convs[0].id).expect(409);
  await s.buyer.post(`/api/listings/${s.listing.id}/status`).send({ status: 'open' }).expect(409);
  await fulfil(s, s.convs[1].id).expect(200); // same deal again is fine
});

test('reopening an unrated deal removes it', async () => {
  const s = await scenario();
  await fulfil(s, s.conv.id).expect(200);
  await s.buyer.post(`/api/listings/${s.listing.id}/status`).send({ status: 'open' }).expect(200);
  assert.equal(await dealOf(s.buyer, s.conv.id), null);
});

test('profiles: public, verified members only, no private details, no way to message', async () => {
  const s = await scenario();
  const p = await profile(s.vendor.id);
  const json = JSON.stringify(p);
  assert.ok(!json.includes('@'), 'no email address');
  assert.equal(p.member.verified, true);
  const unverified = await t.user('email');
  await t.request(t.app).get(`/api/members/${unverified.id}`).expect(404);
  await t.admin.post(`/api/admin/users/${s.vendor.id}/ban`).send({ banned: true }).expect(200);
  await t.request(t.app).get(`/api/members/${s.vendor.id}`).expect(404);
  for (const path of [`/api/members/${s.buyer.id}/messages`, `/api/members/${s.buyer.id}/contact`]) {
    assert.equal((await s.buyer.post(path).send({ message: 'hi' })).status, 404);
  }
});

test('the request page shows the buyer rating', async () => {
  const s = await scenario();
  const l = (await t.request(t.app).get(`/api/listings/${s.listing.id}`).expect(200)).body.listing;
  assert.deepEqual(l.buyer.rating, { average: null, count: 0 });
});
