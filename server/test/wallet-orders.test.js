// The wallet and the orders page (session 58).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { addCredit } = await import('../src/lib/wallet.js');

test('the wallet adds up credit, and the same reward is never given twice', async () => {
  const u = await t.user();
  assert.deepEqual((await u.get('/api/wallet').expect(200)).body, { currency: 'BHD', balance: 0, entries: [] });
  assert.equal(addCredit(t.db, u.id, 1000, 'referral', 'user:99'), true);
  assert.equal(addCredit(t.db, u.id, 1000, 'referral', 'user:99'), false, 'same reason + ref: ignored');
  addCredit(t.db, u.id, 500, 'referral', 'user:100');
  const w = (await u.get('/api/wallet')).body;
  assert.equal(w.balance, 1500);
  assert.deepEqual(w.entries.map((e) => e.amount), [500, 1000]);
  await t.request(t.app).get('/api/wallet').expect(401);
});

test('orders: agreed → paying in parts → rate → done, for both sides', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a camera, orders test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'Got one', offerPrice: 120 }).expect(201)).body.conversation;
  assert.deepEqual((await buyer.get('/api/orders')).body, { inProgress: [], completed: [] }, 'an offer alone is not an order');

  const offer = (await buyer.get(`/api/conversations/${conv.id}`)).body.messages[0];
  await buyer.post(`/api/conversations/${conv.id}/messages/${offer.id}/respond`).send({ action: 'accept' }).expect(201);
  let o = (await buyer.get('/api/orders')).body.inProgress[0];
  assert.deepEqual([o.stage, o.price, o.myRole, o.listing.title], ['agreed', 120, 'buyer', 'Need a camera, orders test']);
  assert.equal((await seller.get('/api/orders')).body.inProgress[0].myRole, 'seller');

  const plan = (await buyer.post(`/api/conversations/${conv.id}/plan`).send({ parts: 2, every: 'week', firstDue: new Date().toISOString().slice(0, 10) }).expect(201)).body.plan;
  await seller.post(`/api/plans/${plan.id}/respond`).send({ action: 'accept' }).expect(200);
  o = (await buyer.get('/api/orders')).body.inProgress[0];
  assert.deepEqual([o.stage, o.plan.partsLeft], ['paying', 2]);
  for (const n of [1, 2]) await seller.post(`/api/plans/${plan.id}/parts/${n}/confirm`).expect(200);

  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'fulfilled', conversationId: conv.id }).expect(200);
  assert.equal((await buyer.get('/api/orders')).body.inProgress[0].stage, 'rate');
  const dealId = (await buyer.get(`/api/conversations/${conv.id}`)).body.conversation.deal.id;
  await buyer.post(`/api/deals/${dealId}/rating`).send({ stars: 5 }).expect(201);
  const after = (await buyer.get('/api/orders')).body;
  assert.equal(after.inProgress.length, 0);
  assert.equal(after.completed[0].stage, 'done');
  assert.equal((await seller.get('/api/orders')).body.inProgress[0].stage, 'rate', 'the seller still has to rate');
});
