// Notifications (🔔, session 13): offer, deal, rating, identity result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const list = async (a) => (await a.get('/api/notifications').expect(200)).body;
const kinds = async (a) => (await list(a)).notifications.map((n) => n.kind);

test('identity approved and rejected are notified', async () => {
  const ok = await t.user('approved');
  assert.deepEqual(await kinds(ok), ['kyc_approved']);

  const no = await t.user('email');
  const sub = await t.kyc(no, { idNumber: 'R-77-123456' }).expect(201);
  await t.admin.post(`/api/admin/kyc/${sub.body.submission.id}/decision`).send({ decision: 'rejected', note: 'Photo is blurry' }).expect(200);
  assert.deepEqual(await kinds(no), ['kyc_rejected']);
});

test('offer -> deal -> rating, each to the right person, and read clears the count', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  await buyer.post('/api/notifications/read').expect(200); // clear the identity one
  await seller.post('/api/notifications/read').expect(200);

  const l = await t.listing(buyer, { title: 'Need a desk lamp' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201)).body.conversation;
  let b = await list(buyer);
  assert.equal(b.unread, 1);
  assert.equal(b.notifications[0].kind, 'offer');
  assert.equal(b.notifications[0].actor.id, seller.id);
  assert.equal(b.notifications[0].listing.title, 'Need a desk lamp');
  assert.equal(b.notifications[0].conversationId, conv.id);

  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'fulfilled', conversationId: conv.id }).expect(200);
  const s = await list(seller);
  assert.equal(s.notifications[0].kind, 'deal');
  assert.equal(s.unread, 1);
  assert.equal((await seller.get('/api/notifications/unread-count').expect(200)).body.unread, 1);

  const dealId = (await buyer.get(`/api/conversations/${conv.id}`).expect(200)).body.conversation.deal.id;
  await seller.post(`/api/deals/${dealId}/rating`).send({ stars: 5 }).expect(201);
  b = await list(buyer);
  assert.equal(b.notifications[0].kind, 'rating');
  assert.equal(b.unread, 2);

  await buyer.post('/api/notifications/read').expect(200);
  assert.equal((await list(buyer)).unread, 0);
  assert.equal((await list(seller)).unread, 1, 'reading is per member');
});

test('undoing a deal removes its notification; logged out gets 401', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a bookshelf' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'Got one' }).expect(201)).body.conversation;
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'fulfilled', conversationId: conv.id }).expect(200);
  assert.ok((await kinds(seller)).includes('deal'));
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'open' }).expect(200);
  assert.ok(!(await kinds(seller)).includes('deal'));
  await t.request(t.app).get('/api/notifications').expect(401);
});
